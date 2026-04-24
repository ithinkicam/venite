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
   * Strip leading/trailing punctuation off a word, returning the three
   * parts. Used by every syllable-splitter helper to keep punctuation out
   * of the accent span.
   */
  private splitOffPunctuation(word: string): {
    leading: string;
    core: string;
    trailing: string;
  } {
    const leadMatch = word.match(/^["'"“‘(\[]+/);
    const trailMatch = word.match(/[.,;:!?"'"”’)\]&]+$/);
    const leading = leadMatch ? leadMatch[0] : '';
    const trailing = trailMatch ? trailMatch[0] : '';
    const core = word.slice(leading.length, word.length - trailing.length);
    return { leading, core, trailing };
  }

  /**
   * Rough English syllable count: count vowel groups, discount silent
   * trailing 'e'. Mirrors `countSyllables` in
   * `ldf/src/chant/generate-gabc.ts` so this component's syllable
   * boundaries stay aligned with the build-time pointer's view of
   * "syllable".
   */
  private countSyllables(word: string): number {
    if (!word) return 0;
    const lower = word.toLowerCase();
    const groups = lower.match(/[aeiouy]+/g);
    let n = groups ? groups.length : 1;
    if (n > 1 && lower.endsWith('e') && !lower.endsWith('ee') && !lower.endsWith('le')) {
      n -= 1;
    }
    return Math.max(1, n);
  }

  /**
   * Split a single word into syllable segments (bare, no surrounding
   * punctuation). Mirrors `splitWordIntoSyllables` in
   * `ldf/src/chant/generate-gabc.ts` so the component's syllable
   * boundaries match the canonical chant syllabifier exactly.
   *
   * Examples (hand-checked):
   *   "shepherd"        → ["shep", "herd"]
   *   "kindness"        → ["kind", "ness"]
   *   "offenses"        → ["of", "fen", "ses"]
   *   "loving-kindness" → ["lo", "ving-", "kind", "ness"]
   */
  private splitCoreIntoSyllables(core: string): string[] {
    if (!core) return [];
    const count = this.countSyllables(core);
    if (count <= 1) return [core];
    const vowelRe = /[aeiouyáéíóú]+/gi;
    const matches: Array<{ start: number; end: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = vowelRe.exec(core)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length });
    }
    if (matches.length <= 1) return [core];
    // Silent-e collapse: if more vowel groups than target syllables,
    // merge the trailing extras into the final syllable.
    let effective = matches;
    if (matches.length > count) {
      effective = matches.slice(0, count);
      effective[effective.length - 1] = {
        start: effective[effective.length - 1].start,
        end: core.length,
      };
    }
    const segments: string[] = [];
    let prevEnd = 0;
    for (let i = 0; i < effective.length; i += 1) {
      if (i === effective.length - 1) {
        segments.push(core.slice(prevEnd));
      } else {
        const curEnd = effective[i].end;
        const nextStart = effective[i + 1].start;
        const cluster = core.slice(curEnd, nextStart);
        // Single intervening consonant goes to the NEXT syllable's onset;
        // multi-consonant clusters split before the last consonant
        // (V|CV vs. VC|CV).
        const split = cluster.length <= 1 ? curEnd : nextStart - 1;
        segments.push(core.slice(prevEnd, split));
        prevEnd = split;
      }
    }
    return segments;
  }

  /**
   * Hint-driven splitter. Given a build-time `mediantStressSyllable` /
   * `finalStressSyllable` index (counted from the start of the word, 0-based,
   * over the canonical syllable segments), wrap the corresponding syllable
   * as the accent.
   *
   * Example: "loving-kindness" with `syllableIndex = 2` yields
   *   prefix="loving-" accent="kind" suffix="ness"
   * (segments: ["lo","ving-","kind","ness"] — index 2 is "kind").
   */
  private splitWordAtSyllable(
    word: string,
    syllableIndex: number,
  ): { prefix: string; accent: string; suffix: string } {
    const { leading, core, trailing } = this.splitOffPunctuation(word);
    if (!core) return { prefix: word, accent: '', suffix: '' };

    const segments = this.splitCoreIntoSyllables(core);
    if (segments.length === 0 || syllableIndex < 0) {
      return { prefix: word, accent: '', suffix: '' };
    }

    const idx = Math.min(syllableIndex, segments.length - 1);
    const before = segments.slice(0, idx).join('');
    const accent = segments[idx];
    const after = segments.slice(idx + 1).join('');
    return {
      prefix: leading + before,
      accent,
      suffix: after + trailing,
    };
  }

  /**
   * Rule-based fallback for fixtures generated before stress hints existed
   * (e.g. hand-pointed Ps 23 + Ps 95). When the word's core ends in any of
   * a known list of unstressed English suffixes, place the accent on the
   * syllable BEFORE the suffix. Otherwise default to the FIRST syllable
   * (English bias toward initial stress for native words). 1-syllable
   * words: the whole word is the accent.
   */
  private splitWordBySuffixRule(word: string): {
    prefix: string;
    accent: string;
    suffix: string;
  } {
    const { leading, core, trailing } = this.splitOffPunctuation(word);
    if (!core) return { prefix: word, accent: '', suffix: '' };

    const segments = this.splitCoreIntoSyllables(core);
    if (segments.length === 0) return { prefix: word, accent: '', suffix: '' };
    if (segments.length === 1) {
      // Whole core is the accent.
      return { prefix: leading, accent: core, suffix: trailing };
    }

    // Unstressed English suffixes — when the core ends in one of these,
    // stress falls on the syllable BEFORE it.
    const SUFFIXES = [
      'eous',
      'ness',
      'tion',
      'sion',
      'ment',
      'able',
      'ible',
      'less',
      'ity',
      'ish',
      'ful',
      'ous',
      'ing',
      'est',
      'ic',
      'al',
      'ly',
      'er',
      'ed',
    ];
    const lower = core.toLowerCase();
    let chosenIndex: number | null = null;
    for (const suf of SUFFIXES) {
      if (lower.length > suf.length && lower.endsWith(suf)) {
        // Find the syllable-segment offset of the suffix's first character.
        // The accented syllable is the LAST segment whose end-offset lies
        // at or before that mark.
        const suffixStart = core.length - suf.length;
        let cumulative = 0;
        let beforeIdx = -1;
        for (let i = 0; i < segments.length; i += 1) {
          cumulative += segments[i].length;
          if (cumulative <= suffixStart) {
            beforeIdx = i;
          } else {
            break;
          }
        }
        if (beforeIdx >= 0) {
          chosenIndex = beforeIdx;
        }
        break;
      }
    }

    if (chosenIndex === null) {
      // English initial-stress bias for multi-syllable words.
      chosenIndex = 0;
    }

    return this.splitWordAtSyllable(word, chosenIndex);
  }

  /**
   * Approximate the final stressed syllable as the last syllable segment
   * of the word's core (excluding leading/trailing punctuation). Returns
   * `{ prefix, accent, suffix }` where `prefix + accent + suffix === word`.
   *
   * Retained as a final fallback when both the build-time hint and the
   * rule-based suffix detector are unavailable. With stress hints flowing
   * from the pointer this should rarely execute.
   */
  private splitWordAtLastVowelCluster(word: string): {
    prefix: string;
    accent: string;
    suffix: string;
  } {
    const { core } = this.splitOffPunctuation(word);
    if (!core) return { prefix: word, accent: '', suffix: '' };

    const segments = this.splitCoreIntoSyllables(core);
    if (segments.length === 0) return { prefix: word, accent: '', suffix: '' };
    return this.splitWordAtSyllable(word, segments.length - 1);
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
    // Hint-driven syllable selection (mediantStressSyllable /
    // finalStressSyllable) is preferred. Rule-based suffix-detection
    // fallback handles fixtures generated before stress hints existed
    // (e.g. hand-pointed Ps 23 + Ps 95).
    const stressHint = isFirstHalf
      ? pointing.mediantStressSyllable
      : pointing.finalStressSyllable;

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
        // Pick the syllable splitter:
        //   1. Hint-driven (build-time `mediantStressSyllable` /
        //      `finalStressSyllable`) when present.
        //   2. Rule-based suffix detector (handles golden Ps 23 + Ps 95
        //      pre-hint fixtures and any future words missed by the dict).
        //   3. Final fallback: last vowel cluster.
        let split;
        if (typeof stressHint === 'number') {
          split = this.splitWordAtSyllable(tok, stressHint);
          if (!split.accent) {
            split = this.splitWordBySuffixRule(tok);
          }
        } else {
          split = this.splitWordBySuffixRule(tok);
        }
        if (!split.accent) {
          split = this.splitWordAtLastVowelCluster(tok);
        }
        const { prefix, accent, suffix } = split;
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
