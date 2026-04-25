import { modalController } from '@ionic/core';
import { Component, Element, Prop, Event, Watch, State, JSX, h, Host, EventEmitter } from '@stencil/core';
import { Psalm, PsalmSection, PsalmVerse, Refrain, Heading, dateFromYMDString, LiturgicalDocument, Change, DisplaySettings, VersePointing, resolvePsalmTone, PsalmToneAssignmentTable, ToneFile, ResolvedTone } from '@venite/ldf';
import { getComponentClosestLanguage } from '../../utils/locale';

import EN from './psalm.i18n.en.json';
import ES from './psalm.i18n.es.json';
import { useDropcap } from '../../utils/dropcaps';
const LOCALE = {
  'en': EN,
  'es': ES
};

/**
 * Render-time pointing lookup table.
 *
 * Keyed by psalm number (string). Each entry exposes a `verses` map keyed by
 * verse number (string) yielding a `VersePointing`. This mirrors the inline
 * `metadata.pointing` shape on `Psalm` docs so `pointingFor()` can read from
 * either source uniformly.
 */
type PointingTable = Record<string, { verses: Record<string, VersePointing> }>;

/**
 * Module-level cache of the pointing table. Shared across all `<ldf-psalm>`
 * instances on the page so the JSON fetch happens at most once per page load
 * (and at most once per psalter, once Phase 2 threads the preference through).
 */
let pointingTablePromise: Promise<PointingTable> | null = null;

/**
 * Normalize a raw `psalms` map from the offline JSON into `PointingTable`
 * shape. Accepts both the declared shape (`psalms[n] = { verses: {...} }`)
 * and the flattened shape currently on disk (`psalms[n] = { "1": {...} }`),
 * so the loader stays tolerant while the fixture layout evolves.
 */
function normalizePointingTable(psalms: Record<string, any> | undefined | null): PointingTable {
  const table: PointingTable = {};
  if (!psalms || typeof psalms !== 'object') return table;
  for (const [psalmNumber, raw] of Object.entries(psalms)) {
    if (!raw || typeof raw !== 'object') continue;
    if (raw.verses && typeof raw.verses === 'object') {
      table[psalmNumber] = { verses: raw.verses as Record<string, VersePointing> };
    } else {
      // Flat shape: the entry itself is the verse-number → VersePointing map.
      table[psalmNumber] = { verses: raw as Record<string, VersePointing> };
    }
  }
  return table;
}

/**
 * Load the offline pointing table for the given psalter. Results are cached
 * at module level. On any fetch failure (404, network, parse error) the
 * loader resolves to an empty table so callers fall through to the plain
 * `<ldf-string>` render path — no thrown exceptions, no broken state.
 */
function loadPointingTable(psalter: string = 'bcp1979'): Promise<PointingTable> {
  if (pointingTablePromise) return pointingTablePromise;
  pointingTablePromise = fetch(`/offline/chant/pointing/psalms-${psalter}.json`)
    .then(res => {
      if (!res.ok) throw new Error(`Pointing table ${psalter} fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => normalizePointingTable(data && data.psalms))
    .catch(err => {
      console.warn('[ldf-psalm] Could not load chant pointing table:', err && err.message);
      return {} as PointingTable; // fail open: no pointing data, fall through to plain text
    });
  return pointingTablePromise;
}

/**
 * Reset the module-level cache. Used by unit tests; not called by production
 * code paths.
 */
function __resetPointingTableCacheForTests() {
  pointingTablePromise = null;
}
// Silence TS "declared but never read" — kept for future test wiring.
void __resetPointingTableCacheForTests;

/**
 * Module-scope cache + loader for the aggregate tones JSON and the per-psalm
 * tone-assignment table. Phase 2 W4 replaces the hardcoded Tone I A snapshot
 * with a per-psalm resolver: `loadToneTable()` fetches both
 * `/offline/chant/tones.json` and `/offline/chant/psalm-tone-assignments.json`
 * once per page load, and `<ldf-psalm>` calls `resolvePsalmTone(...)` against
 * the result to pick the right (variant, differentia) per psalm.
 *
 * Loader is fail-open on all fronts: a missing/invalid tones JSON resolves to
 * `{ tones: [], table: null }` and the notation render path silently skips;
 * a missing assignment table resolves the `tones` half but leaves `table` as
 * `null`, which causes `resolvePsalmTone` to fall through to its built-in
 * default (first available tone/variant/differentia).
 */
type ToneTableSnapshot = { tones: ToneFile[]; table: PsalmToneAssignmentTable | null };
let toneTablePromise: Promise<ToneTableSnapshot> | null = null;

function loadToneTable(): Promise<ToneTableSnapshot> {
  if (toneTablePromise) return toneTablePromise;
  const tonesP = fetch('/offline/chant/tones.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const tonesField = (data && (data.tones || data)) || null;
      // tones may be an array or an object keyed by id.
      const list = Array.isArray(tonesField)
        ? tonesField
        : tonesField
        ? Object.values(tonesField)
        : [];
      return list as ToneFile[];
    })
    .catch((err) => {
      console.warn('[ldf-psalm] Could not load tones:', err);
      return [] as ToneFile[];
    });
  const tableP = fetch('/offline/chant/psalm-tone-assignments.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== 'object') return null;
      // Accept the canonical shape only; resolver tolerates `null`.
      if (!data.assignments && !data.default) return null;
      return data as PsalmToneAssignmentTable;
    })
    .catch((err) => {
      console.warn('[ldf-psalm] Could not load psalm-tone assignments:', err);
      return null as PsalmToneAssignmentTable | null;
    });
  toneTablePromise = Promise.all([tonesP, tableP]).then(([tones, table]) => ({
    tones,
    table,
  }));
  return toneTablePromise;
}

@Component({
  tag: 'ldf-psalm',
  styleUrl: 'psalm.scss',
  scoped: true
})
export class PsalmComponent {
  @Element() element : HTMLElement;

  // States
  @State() obj : Psalm;
  @State() localeStrings: { [x: string]: string; };
  @State() filteredValue : PsalmSection[];
  @State() focusedVerse : number | undefined = undefined;
  @State() focusedSection : number | undefined = undefined;
  /** Render-time pointing lookup keyed by psalm number. Populated by
   *  `loadPointingTable()` in `componentWillLoad`. Empty object when the
   *  fetch fails (fail-open, renders plain text). */
  @State() pointingTable?: PointingTable;
  /** Aggregate tones + per-psalm assignment table loaded from
   *  `/offline/chant/tones.json` and `/offline/chant/psalm-tone-assignments.json`.
   *  Populated by `loadToneTable()` in `componentWillLoad`. `tones` is `[]`
   *  and `table` is `null` when fetches fail — the notation/player render
   *  path silently skips in that case (resolver returns `null`). */
  @State() toneTable?: ToneTableSnapshot;
  /** Resolved tone for THIS psalm. Computed once per `obj` change so the
   *  per-psalm lookup runs at most once per render-cycle, not per verse. */
  @State() resolvedTone?: ResolvedTone | null;

  // Properties
  /** The LDF Psalm to be rendered, either as JSON or an Object */
  @Prop() doc : Psalm | string;
  @Watch('doc')
  docChanged(newDoc : Psalm | string) {
    try {
      if(typeof newDoc == 'string') {
        this.obj = new Psalm(JSON.parse(newDoc));
      } else {
        this.obj = new Psalm(newDoc);
      }
      this.filter();
    } catch(e) {
      console.warn(e);
      this.obj = new Psalm();
    }
  }

  /** A JSON Pointer that points to the Psalm being edited */
  @Prop({ reflect: true }) path : string;

  /** Whether the object is editable */
  @Prop() editable : boolean;

  /** User display preferences. When `chantNotation !== 'off'` and the
   *  psalm has `metadata.pointing.verses[<number>]`, the verse text is
   *  rendered via `<ldf-chant-pointing>` instead of `<ldf-string>`. */
  @Prop() displaySettings : DisplaySettings;

  // Events
  @Event({ bubbles: true }) ldfAskForCanticleOptions : EventEmitter<string>;

  @Event({ bubbles: true }) ldfDocShouldChange : EventEmitter<Change>;

  // Lifecycle events
  async componentWillLoad() {
    this.docChanged(this.doc);
    this.loadLocaleStrings();
    this.filter();
    // Load the offline chant-pointing table. Fetches once per page (cached
    // at module level). If the fetch fails we still render; `pointingTable`
    // ends up as `{}` and `pointingFor()` falls through to plain-text.
    // NB: Phase 1 hardcodes psalter='bcp1979'; Phase 2 will thread the
    // psalter-version preference through.
    const table = await loadPointingTable();
    this.pointingTable = table;
    // Load the tones + per-psalm assignment table, then resolve the tone for
    // THIS psalm. Fails open → `toneTable` ends up with `tones: []` /
    // `table: null` and `resolvedTone` becomes `null`, so the notation /
    // player render path silently skips.
    const toneTable = await loadToneTable();
    this.toneTable = toneTable;
    this.resolvedTone = resolvePsalmTone(
      this.obj?.metadata?.number,
      toneTable.tones,
      toneTable.table,
    );
  }

  // Private methods
  async loadLocaleStrings() : Promise<void> {
    try {
      this.localeStrings = LOCALE[getComponentClosestLanguage(this.element)];
    } catch(e) {
      console.warn(e);
    }
  }

  async changeCanticle() {
    const modal = await modalController.create({
      component: 'ldf-editable-filter-documents',
    });
    modal.componentProps = {
      modal,
      type: "canticle",
      changeCallback: (doc : LiturgicalDocument) => {
        this.ldfDocShouldChange.emit(new Change({
          path: this.path,
          op: [{
            type: 'set',
            oldValue: this.obj,
            value: doc
          }]
        }))
      }
    }

    await modal.present();

    this.ldfAskForCanticleOptions.emit(this.path);
  }

  async filter() {
    this.filteredValue = this.obj.filteredVerses();
  }

  /**
   * Look up pointing metadata for a given verse number. Returns `undefined`
   * if pointing is not present or chant rendering is disabled.
   *
   * Priority order:
   *   1. Inline override on the doc itself (`obj.metadata.pointing.verses`)
   *   2. Lookup by psalm number in the module-loaded `pointingTable`
   *
   * Keeping inline as the higher priority means editorial overrides on a
   * specific doc still win over the generic aggregated table.
   */
  pointingFor(verseNumber: string | undefined) : VersePointing | undefined {
    if (!verseNumber) return undefined;
    if (this.displaySettings?.chantNotation === 'off') return undefined;

    // Priority 1: inline override on the doc itself.
    const inline = this.obj?.metadata?.pointing?.verses?.[verseNumber];
    if (inline) return inline;

    // Priority 2: lookup by psalm number against the loaded table.
    const psalmNumber = this.obj?.metadata?.number;
    if (psalmNumber === undefined || psalmNumber === null) return undefined;
    const key = String(psalmNumber);
    return this.pointingTable?.[key]?.verses?.[verseNumber];
  }

  /**
   * Render the (half-)verse text. When pointing data exists for the verse
   * and `chantNotation !== 'off'`, emit `<ldf-chant-pointing>`; otherwise
   * fall back to the existing `<ldf-string>` path (unchanged behavior).
   */
  renderVerseText(
    text: string,
    verse: PsalmVerse,
    verseRenderIndex: number,
    isHalfVerse: boolean,
  ) : JSX.Element {
    const pointing = this.pointingFor(verse?.number);
    if (pointing) {
      // When chantNotation === 'always' AND a tone has been resolved for
      // this psalm, render `<ldf-chant-notation>` ABOVE the existing
      // chant-pointing overlay. Other `chantNotation` values ('off',
      // 'collapsed', 'tablet-only') leave the overlay-only path unchanged.
      const showNotation =
        this.displaySettings?.chantNotation === 'always' && Boolean(this.resolvedTone);
      return (
        <div class="verse-with-chant">
          {showNotation && (
            <ldf-chant-notation
              text={text}
              tone={JSON.stringify(this.resolvedTone.variant)}
              differentia={JSON.stringify(this.resolvedTone.differentia)}
              pointing={JSON.stringify(pointing)}
            ></ldf-chant-notation>
          )}
          <ldf-chant-pointing
            text={text}
            pointing={JSON.stringify(pointing)}
            psalmsBold={this.displaySettings?.psalmsBold ?? 'none'}
            verseIndex={verseRenderIndex}
            ariaLabel={text}
          ></ldf-chant-pointing>
        </div>
      );
    }
    return (
      <ldf-string text={text}
        citation={{label: this.obj?.label, book: this.obj?.style === 'psalm' ? 'Psalm' : undefined, chapter: this.obj?.metadata?.number, verse: verse.number}}
        dropcap={isHalfVerse ? 'disabled' : useDropcap(this.obj?.language, this.obj?.display_format, verseRenderIndex)}
        index={isHalfVerse ? undefined : verseRenderIndex}
        fragment={this.path}
      >
      </ldf-string>
    );
  }

  // Render helpers
  antiphonNode(antiphon : string | Refrain | { [x: string]: string | Refrain }, notEditable : boolean = false) : JSX.Element {
    if(typeof antiphon == 'string') {
      const refrain = new Refrain({ type: 'refrain', value: [ antiphon ], style: 'antiphon' });
      return <ldf-refrain class='antiphon' doc={ refrain } editable={this.editable && !notEditable} path={`${this.path}/metadata/antiphon`}></ldf-refrain>
    } else if(antiphon?.type) {
      return <ldf-liturgical-document class='antiphon' doc={(antiphon as LiturgicalDocument)} path={`${this.path}/metadata/antiphon`} editable={this.editable && !notEditable}></ldf-liturgical-document>
    } else if(typeof antiphon == 'object') {
      // antiphon is something like an O antiphon tree:
      // dates can be either MM/DD or MM-DD
      // { '12/23': '...', '12/24': '...' }
      const date = this.obj.day ? dateFromYMDString(this.obj?.day?.date) : new Date();
      return this.antiphonNode(antiphon[`${date.getMonth()+1}/${date.getDate()}`] || antiphon[`${date.getMonth() + 1}-${date.getDate()}`], true);
    }
  }

  gloriaNode(gloria : string | Refrain) : JSX.Element {
    if(typeof gloria == 'string') {
      const refrain = new Refrain({ value: [ gloria ], style: 'gloria' });
      return <ldf-liturgical-document doc={ refrain } editable={this.editable}></ldf-liturgical-document>
    } else {
      return <ldf-liturgical-document doc={ gloria } editable={this.editable}></ldf-liturgical-document>
    }
  }

  headingNode(value : string = undefined, level : number = 3, showLatinName : boolean = true, omitCitation : boolean = false, omitSource = false) : JSX.Element {
    let label : string = this.obj.label;
    if(this.obj.style == 'canticle' && this.obj.metadata && this.obj.metadata.number && this.obj.metadata.localname) {
      label = `${this.obj.metadata.number}. ${this.obj.metadata.localname}`;
    } else if(this.obj.style == 'canticle' && this.obj.metadata && this.obj.metadata.localname) {
      label = this.obj.metadata.localname;
    }
    const heading = new Heading({
      type: 'heading',
      metadata: { level },
      citation: !omitCitation && this.obj?.citation !== this.obj?.label ? this.obj?.citation : undefined,
      value: [value ?? label],
      source: omitSource ? undefined : this.obj?.source
    })
    return (
      this.editable
      ? [
        <ldf-label-bar>
          <h3 slot="start" class="editable-label">
            <ldf-editable-text
              id="label"
              text={this.obj?.label}
              path={`${this.path}/label`}
              placeholder={this.localeStrings?.label}
            >
            </ldf-editable-text>
          </h3>
          {this.obj?.metadata && <ldf-editable-text
            id="latinname"
            text={this.obj?.metadata?.latinname}
            path={`${this.path}/metadata/latinname`}
            placeholder={this.localeStrings?.latinname}
          >
          </ldf-editable-text>}
          <ldf-editable-text slot="end"
            id="source-source"
            text={this.obj?.source?.source}
            path={`${this.path}/source/source`}
            placeholder={this.localeStrings?.source}
          >
          </ldf-editable-text>
          <ldf-editable-text slot="end"
            id="source-citation"
            text={this.obj?.source?.citation}
            path={`${this.path}/source/citation`}
            placeholder={this.localeStrings?.source_citation}
          >
          </ldf-editable-text>
        </ldf-label-bar>,
        <ldf-label-bar>
          <ldf-editable-text
            slot="start"
            id="citation"
            text={this.obj?.citation}
            path={`${this.path}/citation`}
            placeholder={this.localeStrings?.citation}
          >
          </ldf-editable-text>
        </ldf-label-bar>
      ]
      : <ldf-heading doc={heading}>
        {showLatinName && <h5 slot='additional'>{this.obj?.metadata?.latinname}</h5>}
      </ldf-heading>
    )
  }

  insertSectionBreakAfterVerse(sectionIndex : number, verseIndex : number) {
    const section = this.obj.value[sectionIndex],
      remainingVerses = section.value.slice(0, verseIndex + 1),
      movingVerses = section.value.slice(verseIndex + 1);
    this.ldfDocShouldChange.emit(new Change({
      path: `${this.path}/value/${sectionIndex}`,
      op: [{
        type: 'set',
        oldValue: section,
        value: {...section, value: remainingVerses}
      }]
    }));
    this.ldfDocShouldChange.emit(new Change({
      path: `${this.path}/value`,
      op: [{
        type: 'insertAt',
        index: sectionIndex + 1,
        oldValue: section,
        value: {...section, value: movingVerses}
      }]
    }));
  }

  removeSectionBreakAfter(sectionIndex : number) {
    const thisSection = this.obj.value[sectionIndex],
      nextSection = this.obj.value[sectionIndex + 1];
    if(thisSection && nextSection) {
      const combinedValue = thisSection.value.concat(nextSection.value);
      this.ldfDocShouldChange.emit(new Change({
        path: `${this.path}/value/${sectionIndex}/value`,
        op: [{
          type: 'set',
          oldValue: thisSection.value,
          value: combinedValue
        }]
      }));
      this.ldfDocShouldChange.emit(new Change({
        path: `${this.path}/value`,
        op: [{
          type: 'deleteAt',
          index: sectionIndex + 1,
          oldValue: nextSection
        }]
      }));
    }
  }

  // Render
  render() {
    const includeAntiphon : boolean = this.obj.includeAntiphon();

    // create blank psalm verse pattern
    let pattern : PsalmVerse,
      templateMaker : (text : string) => PsalmVerse = (verse : string) => ({ type: 'psalm-verse', number: '', halfverse: '', verse });
    if(this.editable) {
      pattern = { ... (this.obj?.value[0]?.value[0] || { type: 'psalm-verse', number: '', halfverse: '', verse: '' }) };
      if(pattern.number) {
        pattern.number = '';
      }
      if(pattern.halfverse) {
        pattern.halfverse = '';
      }
      if(pattern.verse) {
        pattern.verse = '';
      }
    }

    const noNumbers = (this.obj?.value || [])
      .map(section => section.value.map(verse => !Boolean(verse.number)))
      .flat()
      .reduce((a, b) => a || b, false);

    // Precompute per-section offsets so we can compute a stable
    // psalm-wide verse index for `<ldf-chant-pointing verseIndex=...>`.
    // This drives the `'alternate'` bolding mode.
    const sectionOffsets : number[] = [];
    {
      let offset = 0;
      (this.filteredValue || []).forEach(section => {
        sectionOffsets.push(offset);
        offset += (section?.value?.length || 0);
      });
    }

    const localeStrings = this.localeStrings || {};

    // When chant playback is enabled (`chantNotation === 'always'`) AND a
    // tone has been resolved for this psalm AND the pointing table is
    // loaded, render a single `<ldf-chant-player>` above the verses. Audio
    // synthesis lives in a dedicated component so the per-verse
    // `<ldf-chant-notation>` overlay stays visual-only.
    const showChantPlayer =
      this.displaySettings?.chantNotation === 'always' &&
      Boolean(this.resolvedTone) &&
      Boolean(this.pointingTable);

    return (
      <Host lang={this.obj?.language || 'en'}>
        <div class={`psalm-parent ${this.editable ? 'editable' : ''} ${this.obj?.display_format || 'default'} ${noNumbers ? 'no-numbers' : ''}`}>
        {/* Per-psalm audio playback (rendered ONCE, above the verses).
            See showChantPlayer above for the gating logic. */}
        {showChantPlayer && (
          <ldf-chant-player
            doc={JSON.stringify(this.obj)}
            tone={JSON.stringify(this.resolvedTone.variant)}
            differentia={JSON.stringify(this.resolvedTone.differentia)}
            pointingTable={JSON.stringify(this.pointingTable)}
          ></ldf-chant-player>
        )}
        {/* Slot for controls*/}
        { (this.editable || this.obj?.style === 'canticle') && <ldf-label-bar>
          <slot slot='end' name='controls'>
            {this.obj?.style === 'canticle' && this.obj?.metadata?.changeable && <ldf-label-bar>
              <slot slot='end' name='controls'>
                <ion-buttons>
                  <ion-button onClick={() => this.changeCanticle()}>
                    <ion-icon name="swap-horizontal" slot="start"></ion-icon>
                    <ion-label>{localeStrings.changeCanticle}</ion-label>
                  </ion-button>
                </ion-buttons>
              </slot>
            </ldf-label-bar>}
          </slot>
        </ldf-label-bar> }

        {/* Heading */}
        {this.headingNode()}

        {/* opening antiphon */}
        {includeAntiphon && this.antiphonNode(this.obj.metadata.antiphon)}

        {/* render each set of verses */}
        {this.filteredValue?.map((section, sectionIndex) => [
          // render a `Heading`, if this section has a `label`
          section.label && section.value?.length > 0 && this.headingNode(section.label, 4, false, true, true),
  
          // build a set of verses
          <div class='psalm-set'>
          {section.value.map((verse, verseIndex) => {
            // build each verse
            if(verse instanceof Heading) {
              // for e.g., the Benedicite, Heading passed at head of section
              return <ldf-heading doc={verse}></ldf-heading>;
            } else {
              // otherwise, it's a normal psalm verse
              const nodes : JSX.Element[] = new Array();

              // psalm-wide verse index (across sections). Used for
              // alternate-verse bolding and as a dropcap/index hint.
              const verseRenderIndex = (sectionOffsets[sectionIndex] || 0) + verseIndex;

              // 1st half of verse
              nodes.push(
                <div class='verse'>
                  {this.editable ?
                  <ldf-editable-text
                    id={`${this.obj.uid || this.obj.slug}-${sectionIndex}-${verseIndex}-verse`}
                    text={verse.verse}
                    path={`${this.path}/value/${sectionIndex}/value/${verseIndex}/verse`}
                    placeholder='Lorem ipsum sit dolor amet, *'
                    template={pattern}
                    templateMaker={templateMaker}>
                  </ldf-editable-text> :
                  this.renderVerseText(verse.verse, verse, verseRenderIndex, false)}
                </div>
              );

              nodes.push(<br/>);

              // 2nd half of verse
              nodes.push(
                <div class='halfverse'>
                  {this.editable ?
                  <ldf-editable-text
                    id={`${this.obj.uid || this.obj.slug}-${sectionIndex}-${verseIndex}-halfverse`}
                    text={verse.halfverse}
                    path={`${this.path}/value/${sectionIndex}/value/${verseIndex}/halfverse`}
                    placeholder='consectetur adipiscing elit.'
                    template={pattern}>
                  </ldf-editable-text> :
                  this.renderVerseText(verse.halfverse, verse, verseRenderIndex, true)}
                </div>
              );

              // render the verse
              return (
                <p class={this.editable ? 'psalm editable' : 'psalm'} onClick={() => {
                  this.focusedVerse = verseIndex;
                  this.focusedSection = sectionIndex;
                }}>
                  {this.editable ?
                  <ldf-editable-text
                    id={`${this.obj.uid || this.obj.slug}-${sectionIndex}-${verseIndex}-number`}
                    text={verse.number}
                    path={`${this.path}/value/${sectionIndex}/value/${verseIndex}/number`}
                    placeholder='#'
                    template={pattern}>
                  </ldf-editable-text> :
                  (verse.number && <sup>{verse.number}</sup>)}
                  <div class='text'>
                    {nodes}
                    {/* + section break button */}
                    {this.editable && <ion-button fill="clear" class={{"section-break": true, "hidden": this.focusedVerse !== verseIndex || this.focusedSection !== sectionIndex}}
                      onClick={() => this.insertSectionBreakAfterVerse(sectionIndex, verseIndex)}
                    >
                      {localeStrings.section_break_insert}
                    </ion-button>}
                  </div>
                </p>
              );
            }
          })}

          {/* at the end of each set, repeat the antiphon */}
          {
            this.obj.repeatAntiphon(sectionIndex, this.filteredValue.length)
            && <div class='repeat-antiphon'>{this.antiphonNode(this.obj?.metadata?.antiphon)}</div>
          }

          {/* button to remove section break if editable */}
          { this.editable && this.obj.value.length > (sectionIndex + 1) && <ion-button fill="clear" class="section-break"
            onClick={() => this.removeSectionBreakAfter(sectionIndex)}
          >{localeStrings.section_break_remove}</ion-button> }
          </div>
        ])}

      {/* include the Gloria Patri */}
      {this.obj?.metadata?.gloria && !this.obj.metadata.omit_gloria && this.gloriaNode(this.obj.metadata.gloria)}

      {/* include closing antiphon if
        * 1) there IS a Gloria, and it hasn't been omitted, or 
        * 2) there ISN'T a Gloria, or
        * 3) it HAS been omitted */}
      {((this.obj?.metadata?.gloria && !this.obj.metadata.omit_gloria) || (this.obj?.metadata?.gloria === undefined || Boolean(this.obj?.metadata?.omit_gloria))) && includeAntiphon && this.antiphonNode(this.obj?.metadata?.antiphon)}
      </div>
        </Host>
    )
  }
}
