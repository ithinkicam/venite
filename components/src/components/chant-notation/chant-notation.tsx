import { Component, Prop, Element, State, Watch, h, Host } from '@stencil/core';
import { generateGabc } from '@venite/ldf';
import type { ToneVariant, Differentia, VersePointing } from '@venite/ldf';

/**
 * `ldf-chant-notation`
 *
 * Renders square-note Gregorian chant notation as inline SVG, using
 * [Exsurge](https://github.com/frmatthew/exsurge) to lay out a GABC source
 * string. The component accepts EITHER a pre-built `gabc` string OR a tone
 * + differentia + per-verse pointing + verse text triple, in which case it
 * delegates to `generateGabc` from `@venite/ldf` to assemble the GABC.
 *
 * Inputs may be passed as in-memory objects OR JSON-serialized strings (the
 * common case from a Stencil-templated parent that does not control its
 * children's prop coercion).
 *
 * Stencil mode is `scoped: true` (NOT shadow) — Exsurge wants to render its
 * SVG into a real DOM node, and the host element exposes its SVG to global
 * CSS. Exsurge is loaded via dynamic `import()` so its bundle stays out of
 * the main chunk.
 *
 * Renders to a single `<div class="chant-notation-svg">` child, never
 * replacing the host's own innerHTML (Stencil owns the host).
 */
function parseProp<T>(p: T | string | undefined): T | null {
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

@Component({
  tag: 'ldf-chant-notation',
  styleUrl: 'chant-notation.scss',
  scoped: true,
})
export class ChantNotationComponent {
  @Element() el: HTMLElement;

  /** Plain verse text (with optional `*` caesura). Used together with
   *  `tone`, `differentia`, and `pointing` to synthesize GABC when `gabc`
   *  is not directly provided. */
  @Prop() text: string = '';

  /** `ToneVariant` object or a JSON-parseable string of the same. */
  @Prop() tone: ToneVariant | string;

  /** `Differentia` object or a JSON-parseable string of the same. */
  @Prop() differentia: Differentia | string;

  /** `VersePointing` object or a JSON-parseable string of the same. */
  @Prop() pointing: VersePointing | string;

  /** Pre-built GABC source string. When set, overrides `tone` /
   *  `differentia` / `pointing` / `text`. */
  @Prop() gabc: string;

  /** Layout width handed to `score.layoutChantLines`. */
  @Prop() width: number = 800;

  /** Last render error, if any. Used to hide the host via the `.error`
   *  class so a failed notation does not leave a visible empty box. */
  @State() error: string | null = null;

  /** Cache key of the last successful render. Re-used to skip rebuilding
   *  the SVG when no inputs have changed (e.g. cosmetic re-renders). */
  private renderedFor: string = '';

  @Watch('text')
  @Watch('tone')
  @Watch('differentia')
  @Watch('pointing')
  @Watch('gabc')
  inputsChanged() {
    this.renderNotation();
  }

  componentDidLoad() {
    this.renderNotation();
  }

  /**
   * Build (or reuse) a GABC string, hand it to Exsurge, and inject the
   * resulting SVG markup into a child `.chant-notation-svg` container.
   *
   * - If `gabc` is set, it wins. Otherwise we require all of `tone`,
   *   `differentia`, `pointing`; missing inputs put us in the error state.
   * - We await `document.fonts.ready` so Exsurge can measure ExsurgeChar
   *   text correctly. Without this, glyph widths are wrong on first paint.
   * - Exsurge is dynamically imported to keep it out of the main bundle.
   * - On failure we set `error` and log a warning; the host hides itself.
   */
  private async renderNotation() {
    const key = JSON.stringify({ t: this.text, p: this.pointing, g: this.gabc });
    if (key === this.renderedFor) return;
    this.renderedFor = key;
    this.error = null;

    try {
      const tone = parseProp<ToneVariant>(this.tone);
      const differentia = parseProp<Differentia>(this.differentia);
      const pointing = parseProp<VersePointing>(this.pointing);

      let gabcStr = this.gabc;
      if (!gabcStr) {
        if (!tone || !differentia || !pointing) {
          this.error = 'missing inputs';
          return;
        }
        gabcStr = generateGabc({
          tone,
          differentia,
          pointedVerse: pointing,
          text: this.text,
        });
      }

      // Wait for fonts so Exsurge measures text correctly.
      try {
        await (document as any).fonts?.ready;
      } catch (_e) {
        /* no-op — fonts API unavailable, e.g. in jsdom */
      }

      // Dynamic import keeps Exsurge out of the main bundle.
      const exsurge: any = await import('exsurge');

      const ctxt = new exsurge.ChantContext();
      const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabcStr);
      const score = new exsurge.ChantScore(ctxt, mappings, true);

      await new Promise<void>((resolve) =>
        score.performLayout(ctxt, () => resolve()),
      );
      await new Promise<void>((resolve) =>
        score.layoutChantLines(ctxt, this.width, () => resolve()),
      );

      const svgMarkup: string = score.createDrawable(ctxt);

      // Insert into a child container; never replace the host's whole
      // innerHTML (Stencil owns the host).
      let container = this.el.querySelector(
        '.chant-notation-svg',
      ) as HTMLElement | null;
      if (!container) {
        container = document.createElement('div');
        container.className = 'chant-notation-svg';
        this.el.appendChild(container);
      }
      container.innerHTML = svgMarkup;
    } catch (err: any) {
      this.error = String(err?.message || err);
      // eslint-disable-next-line no-console
      console.warn('[ldf-chant-notation] render failed:', err);
    }
  }

  render() {
    return <Host class={this.error ? 'error' : ''}></Host>;
  }
}
