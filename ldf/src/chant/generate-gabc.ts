import { Pitch } from './pitch';
import { NeumeGroup } from './neume-group';
import { ToneVariant } from './tone-variant';
import { Differentia } from './differentia';
import { VersePointing } from './pointing';

/**
 * Input for `generateGabc`.
 *
 * - `tone`: the ToneVariant (intonation, recitingTone, optional secondRecitingTone, mediation).
 * - `differentia`: the termination cadence pair.
 * - `pointedVerse`: per-verse pointing (accent positions, flex, intonation span).
 * - `text`: the raw verse text (may contain an explicit `*` caesura marker).
 *
 * Phase 1 hardcodes the `c4` clef. Other clefs, accidentals (flats), and
 * complex multi-pitch neumes beyond sequential emission are out of scope.
 */
export interface GenerateGabcInput {
  tone: ToneVariant;
  differentia: Differentia;
  pointedVerse: VersePointing;
  text: string;
}

/**
 * Pure GABC-string generator for a psalm verse.
 *
 * Emits a GABC fragment like:
 * `(c4) The(h) Lord(h) is(h) my(g) shep-(f)herd;(f) *(:) I(h) shall(h) not(g) be(f) in(f) want.(d) (::)`
 *
 * Algorithm (Phase 1 smoke-test):
 * 1. Split `text` at the first `*` (caesura) if present; otherwise halve by words.
 * 2. Syllabify each word with a vowel-group heuristic.
 * 3. First half: optional intonation on first N words (from `pointedVerse.intonationWords`),
 *    then reciting tone, then the `tone.mediation.cadence` on the last syllables.
 *    If `pointedVerse.flex` is set, insert a `(;)` marker before the flex word.
 * 4. Second half: reciting tone (or `secondRecitingTone` if provided), then
 *    the `differentia.termination.cadence` on the last syllables.
 * 5. Emit each word as `word(xyz)` with one letter per syllable-note.
 *
 * Out of scope for Phase 1: non-c4 clefs, accidentals, podatus/clivis notation
 * distinctions (multi-note neume groups on a single syllable are concatenated
 * into the same `()` block which GABC already interprets as a compound neume).
 */
export function generateGabc(input: GenerateGabcInput): string {
  const { tone, differentia, pointedVerse, text } = input;

  // --- 1. Split halves on explicit `*` caesura if present, else halve words. ---
  const { firstHalfText, secondHalfText } = splitHalves(text);

  // --- 2. Syllabify both halves. ---
  const firstWords = syllabifyText(firstHalfText);
  const secondWords = syllabifyText(secondHalfText);

  // --- 3. Assign pitches syllable-by-syllable. ---
  const firstAssigned = assignHalf(firstWords, {
    recitingTone: tone.recitingTone,
    intonation: tone.intonation,
    intonationWords: pointedVerse.intonationWords,
    cadence: tone.mediation.cadence,
    flex: pointedVerse.flex,
    isFirstHalf: true,
    accentWordFromEnd: pointedVerse.mediantAccent,
    accentStressSyllable: pointedVerse.mediantStressSyllable,
  });

  const secondHalfRecitingTone = tone.secondRecitingTone ?? tone.recitingTone;
  const secondAssigned = assignHalf(secondWords, {
    recitingTone: secondHalfRecitingTone,
    cadence: differentia.termination.cadence,
    isFirstHalf: false,
    accentWordFromEnd: pointedVerse.finalAccent,
    accentStressSyllable: pointedVerse.finalStressSyllable,
  });

  // --- 4. Emit GABC. ---
  return emitGabc(firstAssigned, secondAssigned);
}

// ---------------------------------------------------------------------------
// Pitch → GABC letter mapping (c4 clef only, Phase 1)
// ---------------------------------------------------------------------------

/**
 * Map a `Pitch` to its GABC letter under a `c4` clef.
 *
 * Under c4 in this project's convention, GABC staff letter `j` = C4 (middle C).
 * Letters descend diatonically: `j` C4, `i` B3, `h` A3, `g` G3, `f` F3,
 * `e` E3, `d` D3, `c` C3, `b` B2, `a` A2. Ascending: `k` D4, `l` E4, `m` F4.
 *
 * Verified against `commonprayer/src/chant/tones/tone-p.json` header comment:
 * "Clef: c4 (C4 at staff position j)".
 *
 * Known mappings for the Sarum corpus in this repo:
 *   { note: 'A', octave: 3 } -> 'h'
 *   { note: 'G', octave: 3 } -> 'g'
 *   { note: 'F', octave: 3 } -> 'f'
 *   { note: 'D', octave: 3 } -> 'd'
 *   { note: 'C', octave: 4 } -> 'j'
 *
 * Accidentals (flats): not supported in Phase 1. If `pitch.accidental === 'b'`
 * we still return the natural letter; a leading `l` flat marker is deferred.
 */
export function pitchToGabcLetter(pitch: Pitch, clef: 'c4' = 'c4'): string {
  if (clef !== 'c4') {
    throw new Error(`Phase 1 supports only c4 clef, got: ${clef}`);
  }
  // Diatonic index: treat C=0, D=1, E=2, F=3, G=4, A=5, B=6 within an octave.
  const noteIdx: Record<Pitch['note'], number> = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6,
  };
  // Absolute diatonic step count from C0.
  const step = pitch.octave * 7 + noteIdx[pitch.note];
  // C3 = 3*7 + 0 = 21, which in our c4-clef mapping is letter 'c'.
  // 'a' (index 0 in gabc alphabet) = A2 = 2*7 + 5 = 19.
  // So GABC letter index = step - 19.
  const letterIdx = step - 19;
  if (letterIdx < 0 || letterIdx >= 13) {
    throw new Error(`Pitch out of c4-clef GABC range (a..m): ${pitch.note}${pitch.octave}`);
  }
  return String.fromCharCode('a'.charCodeAt(0) + letterIdx);
}

// ---------------------------------------------------------------------------
// Syllabification (minimal vowel-group heuristic, Phase 1)
// ---------------------------------------------------------------------------

interface SyllabifiedWord {
  /** Full word text including leading/trailing punctuation. */
  raw: string;
  /** Per-syllable display text (with punctuation re-attached). */
  syllables: string[];
}

const LEADING_PUNCT_RE = /^["'"“‘(\[]+/;
const TRAILING_PUNCT_RE = /[.,;:!?"'"”’)\]&†]+$/;

/**
 * Split `text` into words and each word into syllables by a vowel-group heuristic.
 * Good enough for Phase 1 smoke-test; accurate syllabification is Phase 2.
 */
export function syllabifyText(text: string): SyllabifiedWord[] {
  const rawTokens = text.split(/\s+/).filter(Boolean);
  const words: SyllabifiedWord[] = [];
  for (const token of rawTokens) {
    // Skip bare punctuation-only tokens (including lone caesura markers).
    if (/^[.,;:!?*†]+$/.test(token)) continue;

    const leadingMatch = token.match(LEADING_PUNCT_RE);
    const trailingMatch = token.match(TRAILING_PUNCT_RE);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const core = token.slice(leading.length, token.length - trailing.length);
    if (!core) {
      // Punctuation-only token; treat as a single-syllable word of the trailing text.
      words.push({ raw: token, syllables: [token] });
      continue;
    }

    const segs = splitWordIntoSyllables(core);
    if (segs.length === 0) {
      words.push({ raw: token, syllables: [token] });
      continue;
    }
    // Re-attach leading/trailing punctuation to the first/last syllable.
    segs[0] = leading + segs[0];
    segs[segs.length - 1] = segs[segs.length - 1] + trailing;
    words.push({ raw: token, syllables: segs });
  }
  return words;
}

/** Split a single word into syllable segments (bare, no surrounding punct). */
function splitWordIntoSyllables(word: string): string[] {
  if (!word) return [];
  const count = countSyllables(word);
  if (count <= 1) return [word];

  // Find vowel-group ranges.
  const vowelRe = /[aeiouyáéíóú]+/gi;
  const matches: Array<{ start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = vowelRe.exec(word)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }
  if (matches.length <= 1) return [word];

  // If more vowel groups than target syllables (e.g. silent-e), merge trailing ones.
  let effective = matches;
  if (matches.length > count) {
    effective = matches.slice(0, count);
    effective[effective.length - 1] = {
      start: effective[effective.length - 1].start,
      end: word.length,
    };
  }

  // Each split point: between adjacent vowel groups, just before the last consonant
  // of the intervening cluster (or after the current vowel if single consonant).
  const segments: string[] = [];
  let prevEnd = 0;
  for (let i = 0; i < effective.length; i++) {
    if (i === effective.length - 1) {
      segments.push(word.slice(prevEnd));
    } else {
      const curEnd = effective[i].end;
      const nextStart = effective[i + 1].start;
      const cluster = word.slice(curEnd, nextStart);
      const split = cluster.length <= 1 ? curEnd : nextStart - 1;
      segments.push(word.slice(prevEnd, split));
      prevEnd = split;
    }
  }
  return segments;
}

/** Rough English syllable counter: count vowel groups, discount silent trailing 'e'. */
function countSyllables(word: string): number {
  if (!word) return 0;
  const lower = word.toLowerCase();
  const groups = lower.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (n > 1 && lower.endsWith('e') && !lower.endsWith('ee') && !lower.endsWith('le')) {
    n -= 1;
  }
  return Math.max(1, n);
}

// ---------------------------------------------------------------------------
// Half-verse splitting (explicit `*` or word-halve)
// ---------------------------------------------------------------------------

function splitHalves(
  text: string,
): {
  firstHalfText: string;
  secondHalfText: string;
} {
  const starIdx = text.indexOf('*');
  if (starIdx >= 0) {
    return {
      firstHalfText: text.slice(0, starIdx).trim(),
      secondHalfText: text.slice(starIdx + 1).trim(),
    };
  }
  // No explicit caesura: split at the midpoint by word count.
  const words = text.split(/\s+/).filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  return {
    firstHalfText: words.slice(0, mid).join(' '),
    secondHalfText: words.slice(mid).join(' '),
  };
}

// ---------------------------------------------------------------------------
// Per-half pitch assignment (simplified pointing)
// ---------------------------------------------------------------------------

interface AssignedSyllable {
  text: string;
  /** GABC letters for this syllable's notes, or null for no notes. */
  gabc: string;
  /** Inserted flex marker before this syllable (e.g. '(;)'), if any. */
  flexBefore?: boolean;
}

interface AssignedWord {
  syllables: AssignedSyllable[];
  /** If true, follow this word with the `*` caesura emission. */
  isLastInHalf?: boolean;
}

interface AssignHalfOptions {
  recitingTone: Pitch;
  intonation?: Pitch[];
  intonationWords?: number;
  cadence: NeumeGroup[];
  flex?: { wordFromEnd: number; inflected: boolean };
  isFirstHalf: boolean;
  /**
   * Word-from-end index of the accented word in this half-verse (0 = last word).
   * Sourced from `VersePointing.mediantAccent` (first half) or
   * `VersePointing.finalAccent` (second half). When undefined, defaults to 0.
   */
  accentWordFromEnd?: number;
  /**
   * Syllable-from-start index (0-based) of the stressed syllable WITHIN the
   * accented word. Sourced from `VersePointing.mediantStressSyllable` /
   * `VersePointing.finalStressSyllable`. When undefined, defaults to 0
   * (first syllable of the accented word).
   */
  accentStressSyllable?: number;
}

function assignHalf(words: SyllabifiedWord[], opts: AssignHalfOptions): AssignedWord[] {
  // Flatten into a syllable stream.
  interface FlatSyl {
    text: string;
    wordIdx: number;
    pitches: Pitch[];
  }
  const flat: FlatSyl[] = [];
  words.forEach((w, wi) => {
    w.syllables.forEach((s) => {
      flat.push({ text: s, wordIdx: wi, pitches: [opts.recitingTone] });
    });
  });
  if (flat.length === 0) return [];

  // --- Apply cadence aligned to the stressed syllable ---
  // Find the `accent`-role group in the cadence. Its single neume must land on
  // the stressed syllable of the accent word. Preparation groups walk
  // BACKWARD from there; post-accent groups walk FORWARD.
  //
  // Trailing syllables after the post-accent run (or after the accent itself
  // if the accent is the last group) stay on the reciting tone — this matches
  // the Anglican "recite-then-cadence" convention. Those slots are already
  // initialized to recitingTone above, so we don't need to touch them.
  //
  // Fallback: if no `accent`-role group exists (legacy / synthetic cadences),
  // fall back to the prior "last N syllables, drop preparation from the front"
  // alignment.
  const cadenceGroups = opts.cadence;
  const accentGroupIdx = cadenceGroups.findIndex((g) => g.role === 'accent');

  // `firstCadIdx` is consumed below by the intonation block to avoid
  // overwriting cadence syllables on very short verses. Compute it for both
  // branches.
  let firstCadIdx: number;

  if (accentGroupIdx < 0) {
    // --- Fallback: legacy "last N syllables" alignment ---
    const groupCount = cadenceGroups.length;
    const startFromEnd = Math.min(groupCount, flat.length);
    firstCadIdx = flat.length - startFromEnd;
    const droppedFront = groupCount - startFromEnd; // groups we had to drop
    for (let i = 0; i < startFromEnd; i++) {
      const group = cadenceGroups[droppedFront + i];
      flat[firstCadIdx + i].pitches = [...group.notes];
    }
  } else {
    // --- Stress-aligned placement ---
    const accentWordFromEnd = opts.accentWordFromEnd ?? 0;
    const stressSyllable = opts.accentStressSyllable ?? 0;
    const accentWordIdx = words.length - 1 - accentWordFromEnd;

    // Resolve the flat index of the stressed syllable. If the word index or
    // syllable index is out of range, fall back to the last flat syllable.
    let stressedFlatIdx = flat.length - 1;
    if (accentWordIdx >= 0 && accentWordIdx < words.length) {
      const wordFlatIndices: number[] = [];
      for (let i = 0; i < flat.length; i++) {
        if (flat[i].wordIdx === accentWordIdx) wordFlatIndices.push(i);
      }
      if (wordFlatIndices.length > 0) {
        const sIdx = Math.max(0, Math.min(stressSyllable, wordFlatIndices.length - 1));
        stressedFlatIdx = wordFlatIndices[sIdx];
      }
    }

    // Place the accent-role group on the stressed syllable.
    flat[stressedFlatIdx].pitches = [...cadenceGroups[accentGroupIdx].notes];

    // Place preparation groups BEFORE the accent, walking backward.
    let earliestPlaced = stressedFlatIdx;
    for (let g = accentGroupIdx - 1, idx = stressedFlatIdx - 1; g >= 0 && idx >= 0; g--, idx--) {
      flat[idx].pitches = [...cadenceGroups[g].notes];
      earliestPlaced = idx;
    }
    // (Preparation groups that don't fit before the stressed syllable get
    // dropped, matching the legacy "dropFront" behavior.)

    // Place post-accent groups AFTER the accent, walking forward. Any post-
    // accent groups that overflow past the end of the half-verse are dropped.
    for (
      let g = accentGroupIdx + 1, idx = stressedFlatIdx + 1;
      g < cadenceGroups.length && idx < flat.length;
      g++, idx++
    ) {
      flat[idx].pitches = [...cadenceGroups[g].notes];
    }

    // For intonation-overwrite protection below, treat the earliest placed
    // cadence syllable as the cadence boundary.
    firstCadIdx = earliestPlaced;
  }

  // --- Apply intonation (first half, first verse only) ---
  if (opts.isFirstHalf && opts.intonation && opts.intonation.length > 0 && (opts.intonationWords ?? 0) > 0) {
    // Assign intonation pitches one-per-syllable across the intonation-word span,
    // spilling any remaining pitches onto the next syllable.
    const intWords = opts.intonationWords!;
    const spanEnd = flat.findIndex((s) => s.wordIdx >= intWords);
    const spanEndIdx = spanEnd < 0 ? flat.length : spanEnd;
    let pi = 0;
    for (let i = 0; i < spanEndIdx && pi < opts.intonation.length; i++) {
      // Don't overwrite a cadence syllable (short-verse edge case).
      if (i >= firstCadIdx) break;
      flat[i].pitches = [opts.intonation[pi]];
      pi++;
    }
    // If pitches remain after the span, pile them on the next reciting syllable.
    if (pi < opts.intonation.length && spanEndIdx < firstCadIdx) {
      flat[spanEndIdx].pitches = opts.intonation.slice(pi);
    }
  }

  // --- Flex marker: set a flag on the first syllable of the flex-anchor word ---
  // "wordFromEnd" is 1-based from end of half-verse (1 = last word).
  let flexSyllableIdx: number | null = null;
  if (opts.isFirstHalf && opts.flex) {
    const wordCount = words.length;
    const flexWordIdx = wordCount - opts.flex.wordFromEnd;
    if (flexWordIdx >= 0) {
      // First flat syllable whose wordIdx === flexWordIdx.
      flexSyllableIdx = flat.findIndex((s) => s.wordIdx === flexWordIdx);
    }
  }

  // --- Reconstruct AssignedWord[] ---
  const result: AssignedWord[] = words.map(() => ({ syllables: [] }));
  flat.forEach((fs, i) => {
    const gabcLetters = fs.pitches.map((p) => pitchToGabcLetter(p)).join('');
    result[fs.wordIdx].syllables.push({
      text: fs.text,
      gabc: gabcLetters,
      flexBefore: flexSyllableIdx === i ? true : undefined,
    });
  });
  return result;
}

// ---------------------------------------------------------------------------
// GABC emission
// ---------------------------------------------------------------------------

function emitGabc(firstHalf: AssignedWord[], secondHalf: AssignedWord[]): string {
  const pieces: string[] = ['(c4)'];

  emitHalf(pieces, firstHalf);
  // Caesura between halves.
  pieces.push('*(:)');
  emitHalf(pieces, secondHalf);
  pieces.push('(::)');

  return pieces.join(' ');
}

function emitHalf(out: string[], words: AssignedWord[]): void {
  for (const word of words) {
    const parts: string[] = [];
    let emittedFlex = false;
    for (const syl of word.syllables) {
      if (syl.flexBefore && !emittedFlex) {
        // Emit the flex break marker before this syllable.
        // We use `(;)` (GABC semicolon bar) as the flex marker per Phase 1 convention.
        parts.push('(;)');
        emittedFlex = true;
      }
      parts.push(`${syl.text}(${syl.gabc})`);
    }
    out.push(parts.join(''));
  }
}
