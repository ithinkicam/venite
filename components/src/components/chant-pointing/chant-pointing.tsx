import { Component, Prop, h, Host } from '@stencil/core';
import type { VersePointing } from '@venite/ldf';

/**
 * `ldf-chant-pointing`
 *
 * CSS overlay that wraps a verse (or half-verse) of psalm text and
 * span-wraps the accented syllable(s) for mediant/final cadences, inserts
 * a flex dagger if requested, and renders the caesura (`*`) as a styled
 * span. The bolding is controlled by `psalmsBold`:
 *   - `'none'`    — accent spans present but not bold
 *   - `'all'`     — every verse's accents are bold
 *   - `'alternate'` — bold on even `verseIndex` (0, 2, 4, …)
 *
 * Half-verse detection is by trailing `*`: if the text (after trim) ends
 * with `*`, we treat it as the first half of the verse and apply
 * `mediantAccent`; otherwise we apply `finalAccent`.
 *
 * A `flex` pointing only inflects the first half; we insert the `†` marker
 * before the word identified by `flex.wordFromEnd` counted from the end of
 * the first half (the end excluding the `*` token).
 *
 * `aria-label` is set to the plain text so screen readers skip the
 * accent/flex chrome. Unicode markers `*` (U+002A) and `†` (U+2020) are
 * emitted directly; per accessibility guidance we do not use entity escapes.
 */
@Component({
  tag: 'ldf-chant-pointing',
  styleUrl: 'chant-pointing.scss',
  shadow: true,
})
export class ChantPointingComponent {
  /** The verse or half-verse text. May end with `*` to mark the caesura. */
  @Prop() text: string = '';

  /** `VersePointing` object or JSON-parseable string. */
  @Prop() pointing: VersePointing | string;

  /** Bold policy for accented syllables. */
  @Prop() psalmsBold: 'none' | 'alternate' | 'all' = 'none';

  /** Verse index (0-based) — used for 'alternate' bolding. */
  @Prop() verseIndex: number = 0;

  /** Screen-reader label; falls back to `this.text` if unset. */
  @Prop() ariaLabel: string;

  private parsedPointing(): VersePointing | null {
    if (!this.pointing) return null;
    if (typeof this.pointing === 'string') {
      try {
        return JSON.parse(this.pointing);
      } catch (_e) {
        return null;
      }
    }
    return this.pointing;
  }

  private shouldBold(): boolean {
    if (this.psalmsBold === 'none') return false;
    if (this.psalmsBold === 'all') return true;
    // 'alternate': bold on even verseIndex (0, 2, 4, …)
    return this.verseIndex % 2 === 0;
  }

  /**
   * Approximate the final stressed syllable as the last vowel cluster in
   * the word's core (excluding leading/trailing punctuation). Returns
   * `{ prefix, accent, suffix }` where `prefix + accent + suffix === word`.
   * If no vowel is found, `accent` is empty and the full word is in
   * `prefix`.
   */
  private splitWordAtLastVowelCluster(word: string): {
    prefix: string;
    accent: string;
    suffix: string;
  } {
    // Strip leading/trailing punctuation into prefix/suffix.
    const leadMatch = word.match(/^["'"“‘(\[]+/);
    const trailMatch = word.match(/[.,;:!?"'"”’)\]&]+$/);
    const leading = leadMatch ? leadMatch[0] : '';
    const trailing = trailMatch ? trailMatch[0] : '';
    const core = word.slice(leading.length, word.length - trailing.length);

    if (!core) {
      return { prefix: word, accent: '', suffix: '' };
    }

    // Find all vowel-cluster matches in the core.
    const vowelRe = /[aeiouyáéíóúAEIOUYÁÉÍÓÚ]+/g;
    let last: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = vowelRe.exec(core)) !== null) {
      last = m;
    }

    if (!last) {
      return { prefix: word, accent: '', suffix: '' };
    }

    const start = last.index;
    // Accent runs from the last vowel cluster start through the end of the
    // core (consonants that close the stressed syllable get the weight too).
    const accent = core.slice(start);
    const prefix = leading + core.slice(0, start);
    const suffix = trailing;
    return { prefix, accent, suffix };
  }

  render() {
    const text = this.text || '';
    const aria = this.ariaLabel || text;
    const pointing = this.parsedPointing();

    // Bare render with no pointing: host contains plain text only.
    if (!pointing) {
      return (
        <Host aria-label={aria}>{text}</Host>
      );
    }

    // ------------------------------------------------------------------
    // Tokenize: split on whitespace, preserving caesura (`*`) as its own token.
    // Words and punctuation tokens are recorded; caesura position is tracked
    // separately so we can render it as a styled span.
    // ------------------------------------------------------------------
    const trimmed = text.trim();
    const hasCaesura = /\*\s*$/.test(trimmed);
    const isFirstHalf = hasCaesura;

    // Strip the trailing `*` from text for word-indexing; render it explicitly.
    const bodyText = hasCaesura
      ? trimmed.replace(/\*\s*$/, '').trimEnd()
      : trimmed;

    const rawTokens = bodyText.split(/\s+/).filter(Boolean);
    // Identify which tokens are words (contain at least one letter) vs. bare
    // punctuation. The from-end indices in pointing refer to word positions,
    // counting words only.
    const isWordToken = (t: string) => /[a-zA-ZáéíóúÁÉÍÓÚ]/.test(t);
    const wordIndices: number[] = []; // positions in rawTokens that are words
    rawTokens.forEach((tok, i) => {
      if (isWordToken(tok)) wordIndices.push(i);
    });
    const wordCount = wordIndices.length;

    // Pick which accent index applies to this half.
    const accentFromEnd = isFirstHalf ? pointing.mediantAccent : pointing.finalAccent;
    const accentTokenPos =
      typeof accentFromEnd === 'number' && wordCount > 0
        ? wordIndices[wordCount - 1 - accentFromEnd]
        : -1;
    const accentClassSuffix = isFirstHalf ? 'mediant' : 'final';

    // Flex applies only to the first half-verse.
    const flexFromEnd =
      isFirstHalf && pointing.flex ? pointing.flex.wordFromEnd : undefined;
    const flexTokenPos =
      typeof flexFromEnd === 'number' && wordCount > 0
        ? wordIndices[wordCount - 1 - flexFromEnd]
        : -1;

    // ------------------------------------------------------------------
    // Emit spans.
    // ------------------------------------------------------------------
    const hostClass = this.shouldBold() ? 'bold' : '';
    const children: any[] = [];

    rawTokens.forEach((tok, i) => {
      // Insert flex marker *before* the flex word token (and a space after
      // it so it visually separates from the following word).
      if (i === flexTokenPos) {
        children.push(<span class="flex-mark">†</span>);
        children.push(' ');
      }

      if (i === accentTokenPos) {
        // Wrap the last stressed syllable of this word.
        const { prefix, accent, suffix } = this.splitWordAtLastVowelCluster(tok);
        if (accent) {
          children.push(
            <span class="word-accented">
              {prefix}
              <span class={`accent accent-${accentClassSuffix}`}>{accent}</span>
              {suffix}
            </span>,
          );
        } else {
          // No vowel found — emit plain word, no accent span.
          children.push(<span class="word">{tok}</span>);
        }
      } else {
        children.push(<span class="word">{tok}</span>);
      }

      // Insert a single space after the token, except after the last token.
      if (i < rawTokens.length - 1) {
        children.push(' ');
      }
    });

    // Trailing caesura rendered as a styled span (preserve the real `*`).
    if (hasCaesura) {
      children.push(<span class="caesura">*</span>);
    }

    return (
      <Host class={hostClass} aria-label={aria}>
        {children}
      </Host>
    );
  }
}
