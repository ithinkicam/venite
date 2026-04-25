import { Component, Prop, State, h, Host } from '@stencil/core';
import { generatePitchSequence } from '@venite/ldf';
import type {
  Psalm,
  PsalmVerse,
  ToneVariant,
  Differentia,
  Pitch,
  PitchedSyllable,
  VersePointing,
} from '@venite/ldf';

/**
 * `ldf-chant-player`
 *
 * Synthesizes audible chant from a `Psalm` doc + tone + differentia +
 * pointing-table snapshot, using [Tone.js](https://tonejs.github.io/) for
 * audio scheduling. Renders a single play / stop button group; each press
 * iterates every filtered verse in document order, calling
 * `generatePitchSequence` per verse to produce a stream of
 * `PitchedSyllable`s and scheduling each on the Web Audio clock.
 *
 * Props may be passed as in-memory objects OR JSON-serialized strings
 * (Stencil parents using template attributes serialize objects). The
 * Tone.js bundle is loaded lazily via a `<script>` tag in the consuming
 * app's index.html and attaches to `window.Tone`; the component polls for
 * it on first user gesture (mirrors the `<ldf-chant-notation>` Exsurge
 * pattern).
 *
 * `Tone.start()` MUST be invoked inside a user-gesture handler — browsers
 * refuse to start the AudioContext otherwise. We do that on the play
 * button click; nothing audio-related runs in `componentDidLoad`.
 */
function parseProp<T>(p: T | string | undefined | null): T | null {
  if (p === undefined || p === null) return null;
  if (typeof p === 'string') {
    try {
      return JSON.parse(p);
    } catch {
      return null;
    }
  }
  return p;
}

/**
 * Convert a `Pitch` to a Tone.js-friendly note name string. Tone v14
 * accepts strings like `"A3"`, `"F#3"`, or `"Bb3"` — see the
 * `Tone.Frequency` parser. The Sarum corpus only uses `b` (flat)
 * accidentals so we don't worry about `#` here.
 *
 * NOT exported: Stencil's bundler enforces a single export per @Component
 * file (the component class). Helpers live as module-private functions.
 */
function pitchToFrequencyString(p: Pitch): string {
  const accidental = p.accidental === 'b' ? 'b' : '';
  return `${p.note}${accidental}${p.octave}`;
}

/**
 * Poll for `window.Tone` (attached by the `<script>` tag in the consuming
 * app's index.html). Resolves with the global module or rejects after
 * `timeoutMs` if the script never loads.
 */
function waitForTone(timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const w: any = typeof window !== 'undefined' ? window : {};
      if (w.Tone) return resolve(w.Tone);
      if (Date.now() - start > timeoutMs)
        return reject(new Error('Tone global not found'));
      setTimeout(check, 50);
    };
    check();
  });
}

@Component({
  tag: 'ldf-chant-player',
  styleUrl: 'chant-player.scss',
  scoped: true,
})
export class ChantPlayerComponent {
  /** The psalm doc (object or JSON string). The player iterates
   *  `filteredVerses()` in the same order the visible psalm renders. */
  @Prop() doc: Psalm | string;

  /** `ToneVariant` (object or JSON string). Phase 2 hardcodes Tone I A
   *  via the parent `<ldf-psalm>`. */
  @Prop() tone: ToneVariant | string;

  /** `Differentia` (object or JSON string). */
  @Prop() differentia: Differentia | string;

  /** `PointingTable` keyed by psalm number; each value is
   *  `{ verses: { [n]: VersePointing } }`. Or a JSON string of same.
   *  Verses without a pointing entry are skipped during playback. */
  @Prop() pointingTable: any;

  /** Seconds per syllable (chant tempo). Default tuned to ~134 syllables
   *  per minute, on the slow end of speaking pace. */
  @Prop() secondsPerSyllable: number = 0.45;

  /** Extra pause inserted at the caesura between half-verses. */
  @Prop() caesuraPause: number = 0.5;

  /** Whether the player is currently playing. Drives the button label
   *  and the host's `.playing` class. */
  @State() playing: boolean = false;

  /** Whether the player is ready to play. Set to `false` while we wait
   *  for `Tone.start()` to settle. */
  @State() ready: boolean = true;

  /** The active Tone.Synth instance. Recreated each play so we don't
   *  carry stale envelope state between sessions. */
  private synth: any = null;

  /** Pending `setTimeout` IDs and Tone.Transport scheduled IDs that the
   *  stop button needs to cancel. */
  private timeoutIds: any[] = [];
  private toneScheduledIds: number[] = [];

  /**
   * Lazily-resolved Tone global. Cached on first successful resolve so
   * subsequent plays don't re-poll. Cleared on stop only if the synth
   * was disposed (so the next play re-derives a fresh oscillator).
   */
  private async ensureTone(): Promise<any> {
    return waitForTone();
  }

  /** Read the psalm doc and yield each filterable verse in render order. */
  private extractVerses(): PsalmVerse[] {
    const docObj = parseProp<Psalm>(this.doc);
    if (!docObj) return [];
    const sections: any[] = (docObj as any).value || [];
    const out: PsalmVerse[] = [];
    for (const section of sections) {
      const verses: any[] = section?.value || [];
      for (const v of verses) {
        // Heading entries (e.g. inside Benedicite) have a `type === 'heading'`
        // — they have no number/verse text, so just skip them.
        if (!v || v.type === 'heading') continue;
        out.push(v as PsalmVerse);
      }
    }
    return out;
  }

  /** Resolve `psalmNumber` from the doc metadata. Returns `null` if the
   *  doc has no number (e.g. a canticle without a numeric key). */
  private psalmNumber(): string | null {
    const docObj = parseProp<Psalm>(this.doc) as any;
    const n = docObj?.metadata?.number;
    if (n === undefined || n === null) return null;
    return String(n);
  }

  /**
   * Look up the per-verse pointing for a given verse number, preferring
   * an inline override on the doc itself before falling back to the
   * psalm-keyed table prop. Mirrors `<ldf-psalm>.pointingFor()`.
   */
  private pointingFor(verseNumber: string | undefined): VersePointing | undefined {
    if (!verseNumber) return undefined;
    const docObj = parseProp<Psalm>(this.doc) as any;
    const inline =
      docObj?.metadata?.pointing?.verses?.[verseNumber];
    if (inline) return inline as VersePointing;
    const table = parseProp<any>(this.pointingTable);
    const psalmNumber = this.psalmNumber();
    if (!table || !psalmNumber) return undefined;
    return table?.[psalmNumber]?.verses?.[verseNumber];
  }

  /**
   * Entry point for the play button. Resolves the Tone global, calls
   * `Tone.start()` (the autoplay-policy unlock), constructs a fresh
   * `Tone.Synth`, and schedules the entire psalm.
   *
   * If anything fails (no Tone global, no doc, no pointing) we log and
   * leave `playing === false` so the user can retry.
   */
  async play() {
    if (this.playing) return;
    const tone = parseProp<ToneVariant>(this.tone);
    const differentia = parseProp<Differentia>(this.differentia);
    if (!tone || !differentia) {
      console.warn('[ldf-chant-player] missing tone or differentia');
      return;
    }

    this.ready = false;
    let Tone: any;
    try {
      Tone = await this.ensureTone();
      // `Tone.start()` MUST be inside a user gesture (we are — the
      // button click brought us here). It returns a Promise that
      // resolves once the AudioContext is running.
      await Tone.start();
    } catch (err) {
      console.warn('[ldf-chant-player] could not start Tone:', err);
      this.ready = true;
      return;
    }
    this.ready = true;

    this.synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.2 },
    }).toDestination();

    this.playing = true;
    this.schedulePsalm(Tone, tone, differentia);
  }

  /**
   * Walk every verse in render order, calling `generatePitchSequence`
   * per verse and pushing each note onto the Tone.Synth at an
   * `AudioContext`-relative absolute time. Inserts a half-second pause
   * between verses so they don't bleed into each other.
   *
   * Verses without a pointing entry are silently skipped. We still
   * advance the cursor by zero — these verses are simply not chanted.
   */
  private schedulePsalm(
    Tone: any,
    toneVariant: ToneVariant,
    differentia: Differentia,
  ) {
    const verses = this.extractVerses();
    const now = Tone.now();
    let cursor = now;

    for (const verse of verses) {
      const pointing = this.pointingFor(verse?.number);
      if (!pointing) continue;

      // Reconstruct the verse text in the same shape the visible
      // notation receives: full verse + explicit caesura + halfverse.
      // If only one half is populated, fall back to it directly.
      let text: string;
      if (verse.verse && verse.halfverse) {
        text = `${verse.verse} * ${verse.halfverse}`;
      } else {
        text = verse.verse || verse.halfverse || '';
      }
      if (!text.trim()) continue;

      let pitched: PitchedSyllable[];
      try {
        pitched = generatePitchSequence({
          tone: toneVariant,
          differentia,
          pointedVerse: pointing,
          text,
        });
      } catch (err) {
        console.warn(
          '[ldf-chant-player] generatePitchSequence failed for verse',
          verse?.number,
          err,
        );
        continue;
      }

      for (const syl of pitched) {
        if (syl.isCaesura) {
          cursor += this.caesuraPause;
          continue;
        }
        if (!syl.pitches || syl.pitches.length === 0) {
          cursor += this.secondsPerSyllable;
          continue;
        }
        // For Phase 2 we trigger only the first pitch on the syllable.
        // Compound neume groups (multiple pitches per syllable, i.e.
        // melismas) become a Phase 3 polish item.
        const freq = pitchToFrequencyString(syl.pitches[0]);
        try {
          this.synth.triggerAttackRelease(
            freq,
            this.secondsPerSyllable * 0.9,
            cursor,
          );
        } catch (err) {
          console.warn(
            '[ldf-chant-player] triggerAttackRelease failed:',
            freq,
            err,
          );
        }
        cursor += this.secondsPerSyllable;
      }

      // Brief gap between verses.
      cursor += this.caesuraPause;
    }

    // Schedule the "playing finished" callback. We use a plain
    // `setTimeout` instead of `Tone.Transport.scheduleOnce` because
    // we never started Transport — we scheduled directly on the
    // AudioContext clock via `triggerAttackRelease(time)`. The
    // `setTimeout` is wall-clock-relative, which lines up with the
    // AudioContext clock on most browsers; the +200ms buffer absorbs
    // any drift between the two.
    const finishMs = (cursor - now) * 1000 + 200;
    const timeoutId = setTimeout(() => {
      this.finishPlayback();
    }, Math.max(0, finishMs));
    this.timeoutIds.push(timeoutId);
  }

  /** Common stop / finish path. Cancels any pending timeouts, disposes
   *  the synth, and clears the playing flag. Safe to call multiple
   *  times. */
  private finishPlayback() {
    for (const id of this.timeoutIds) {
      try {
        clearTimeout(id);
      } catch (_e) {
        /* ignore */
      }
    }
    this.timeoutIds = [];
    if (this.toneScheduledIds.length > 0) {
      const w: any = typeof window !== 'undefined' ? window : {};
      const Tone = w.Tone;
      for (const id of this.toneScheduledIds) {
        try {
          Tone?.Transport?.clear?.(id);
        } catch (_e) {
          /* ignore */
        }
      }
      this.toneScheduledIds = [];
    }
    if (this.synth) {
      try {
        this.synth.dispose();
      } catch (_e) {
        /* ignore */
      }
      this.synth = null;
    }
    this.playing = false;
  }

  /** Stop button entry point. */
  stop() {
    this.finishPlayback();
  }

  /** Stencil disconnect hook — make sure we don't leak audio nodes if
   *  the user navigates away mid-playback. */
  disconnectedCallback() {
    this.finishPlayback();
  }

  render() {
    return (
      <Host class={this.playing ? 'playing' : ''}>
        <ion-buttons>
          {this.playing ? (
            <ion-button
              fill="solid"
              color="primary"
              onClick={() => this.stop()}
              disabled={!this.ready}
            >
              <ion-icon name="stop" slot="start"></ion-icon>
              <ion-label>Playing&hellip;</ion-label>
            </ion-button>
          ) : (
            <ion-button
              fill="outline"
              color="primary"
              onClick={() => this.play()}
              disabled={!this.ready}
            >
              <ion-icon name="play" slot="start"></ion-icon>
              <ion-label>Chant</ion-label>
            </ion-button>
          )}
        </ion-buttons>
      </Host>
    );
  }
}
