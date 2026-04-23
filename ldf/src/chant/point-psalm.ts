import { syllabifyText } from './generate-gabc';
import { ToneVariant } from './tone-variant';
import { VersePointing } from './pointing';

/**
 * Input for `pointVerse`.
 *
 * - `text`: the first half of a psalm verse (everything up to the asterisk /
 *   mediant caesura). May contain a `\n` inside it to mark a flex break.
 * - `halfverse`: the second half of the verse (everything after the asterisk).
 *   Optional — if omitted the algorithm falls back to halving `text` at the
 *   first `*`.
 * - `tone`: the `ToneVariant` used for pointing. Only the shape is consumed
 *   (mediation cadence, intonation, etc.); the algorithm itself does not
 *   depend on specific pitches.
 * - `language`: `'en'` (default) or `'la'`. Only `'en'` is exercised in
 *   Phase 1 — Latin is a Phase-2 concern.
 * - `isVerseOne`: when `true`, the output includes `intonationWords` reflecting
 *   the Anglican / Sarum convention of two-word intonation on the first verse
 *   of a psalm.
 */
export interface PointVerseInput {
  text: string;
  halfverse?: string;
  tone: ToneVariant;
  language?: 'en' | 'la';
  isVerseOne?: boolean;
}

/**
 * Produce a `VersePointing` for a single psalm verse.
 *
 * Phase-1 implementation is **in-house** rather than a wrapper around the
 * vendored `bbloomf/jgabc/psalmtone.js`.  The vendored file (retained under
 * `ldf/src/chant/vendor/` for attribution and future reference) was rejected
 * as a runtime dependency for three reasons, all of which would have required
 * substantially more scaffolding than a direct TS port of the needed
 * heuristics:
 *
 *  1. It executes browser-only code at module scope: `localStorage.gabcStar`,
 *     `window.localStorage.words`, and a `URLSearchParams(location.search)`
 *     call inside `applyPsalmTone`.  These throw under Jest's `node`
 *     environment unless the module is guarded with jsdom.
 *  2. Its English syllabifier (`Syl.syllabify`) depends on an optional
 *     `Hypher` global plus a remote syllable-lookup endpoint
 *     (`sourceandsummit.com/editor/legacy/syl.php`); neither is appropriate
 *     for a hermetic Jest suite.
 *  3. The public entry point `applyPsalmTone` returns formatted output
 *     (HTML / TeX / GABC with `<b><i>` markup) rather than a structured
 *     accent-position record.  We would still have to string-parse that
 *     output to recover the `VersePointing` shape.
 *
 * The algorithm here is a structural English-pointing heuristic consistent
 * with the Anglican conventions documented in
 * `.planning/research/chant-pdfs.md` § 2 and hand-applied in the golden
 * fixtures at `commonprayer/src/chant/pointing/`.  Summary:
 *
 *   - `mediantAccent` / `finalAccent` are **word-from-end** indices into the
 *     respective half-verse (0 = last word, 1 = penultimate, ...).  This
 *     follows the comment in the golden fixtures ("Word indices are from
 *     the END of each half-verse, 0-based (0 = last word)"); `pointing.ts`'s
 *     docstring describes them as "syllable-from-end" which is inconsistent
 *     with the fixtures — fixtures win for Phase 1.
 *   - Accent selection: if the last word of a half-verse is a monosyllabic
 *     **clitic pronoun** (me/us/him/her/them/thee/thou/it/you), the accent
 *     is placed on the preceding word (`index = 1`).  Otherwise the accent
 *     falls on the last word (`index = 0`).  This matches the fixture
 *     behaviour in Ps 23 v5 first half ("... who trouble me" → 1) and
 *     Ps 95 v5 first half ("... for he made it" → 1).
 *   - `ending: 'dactylic'` is set on the verse when the second half ends
 *     with the dactyl pattern `[long, clitic, clitic]` — i.e. a 2+ syllable
 *     word followed by two monosyllabic clitics, as in Ps 23 v4
 *     "... they comfort me" (COM-fort-me).
 *   - `flex` is detected from an explicit `\n` in `text` (the first half).
 *     Its `wordFromEnd` is the index-from-end of the word immediately
 *     preceding the `\n`, counted over the full first-half word sequence
 *     (this matches the fixture encoding for Ps 23 v4 and Ps 95 v7/v8).
 *   - `intonationWords` is `2` when `isVerseOne` is true, matching the
 *     Anglican convention; otherwise omitted.
 *
 * Intentional simplifications (Phase 1, iterated later via the
 * `/chant-pointing` skill at W4.1):
 *
 *   - No dictionary-based stress detection.  The heuristic relies on
 *     structural position, not phonological accent per syllable.
 *   - `preparatorySyllables` is never emitted; the renderer/tone handles
 *     preparation notes structurally.
 *   - `caesura` is not computed.  Sub-half caesuras would need syntactic
 *     analysis beyond Phase 1 scope.
 *   - Latin (`language: 'la'`) currently runs the same code path; the
 *     clitic list is English-only so Latin verses will nearly always get
 *     `accent = 0`.  This is acceptable since no Phase-1 fixture is Latin.
 */
export function pointVerse(input: PointVerseInput): VersePointing {
  const { text, halfverse, tone, isVerseOne = false } = input;

  // 1. Split halves.  If `halfverse` is explicit use it; otherwise look for
  //    the asterisk caesura in `text`; otherwise halve the word list.
  const { firstHalfText, secondHalfText } = splitHalves(text, halfverse);

  // 2. Detect a flex in the first half (encoded as `\n`).  Record the
  //    word-from-end index of the word immediately preceding the `\n`,
  //    counted over the full first-half word sequence.
  const flex = detectFlex(firstHalfText);

  // 3. Strip the flex newline so syllabification sees a clean word stream.
  const cleanedFirstHalf = firstHalfText.replace(/\s*\n\s*/g, ' ').trim();

  // 4. Word-from-end accent positions for each half.
  const mediantAccent = accentWordFromEnd(cleanedFirstHalf);
  const finalAccent = accentWordFromEnd(secondHalfText);

  // 5. Dactylic-ending detection on the second half.
  const ending = isDactylicEnding(secondHalfText) ? 'dactylic' : undefined;

  const pointing: VersePointing = {
    mediantAccent,
    finalAccent,
  };

  if (flex) {
    pointing.flex = flex;
  }
  if (ending) {
    pointing.ending = ending;
  }
  if (isVerseOne) {
    pointing.intonationWords = defaultIntonationWords(tone);
  }

  return pointing;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Monosyllabic clitic pronouns and particles that tend **not** to carry the
 * final stress of a psalm half-verse in English.  Drawn from inspection of
 * the BCP 1979 Ps 23 + Ps 95 fixtures; extend as new divergences surface via
 * the Gate-2 `/chant-pointing` skill.
 */
const CLITIC_WORDS: ReadonlySet<string> = new Set([
  'me',
  'us',
  'him',
  'her',
  'them',
  'thee',
  'thou',
  'it',
  'you',
  'my',
  'his',
  'its',
  'our',
  'your',
  'their',
]);

function splitHalves(
  text: string,
  halfverse: string | undefined,
): {
  firstHalfText: string;
  secondHalfText: string;
} {
  if (halfverse !== undefined && halfverse !== null) {
    return {
      firstHalfText: stripCaesuraMarkers(text),
      secondHalfText: stripCaesuraMarkers(halfverse),
    };
  }
  const starIdx = text.indexOf('*');
  if (starIdx >= 0) {
    return {
      firstHalfText: stripCaesuraMarkers(text.slice(0, starIdx)),
      secondHalfText: stripCaesuraMarkers(text.slice(starIdx + 1)),
    };
  }
  // No explicit caesura: halve by word count.
  const words = text.split(/\s+/).filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  return {
    firstHalfText: stripCaesuraMarkers(words.slice(0, mid).join(' ')),
    secondHalfText: stripCaesuraMarkers(words.slice(mid).join(' ')),
  };
}

function stripCaesuraMarkers(text: string): string {
  // Drop any stray asterisk / dagger markers; trim.
  return text.replace(/[*†]/g, '').trim();
}

/**
 * Tokenise a half-verse into content words (strips punctuation-only tokens
 * and bare caesura markers).
 */
function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-zÀ-ɏ'’]+|[^A-Za-zÀ-ɏ'’]+$/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * Word-from-end index of the accented word for a half-verse.
 *
 * Heuristic: if the final word is a clitic and at least one prior content
 * word exists, the accent sits on the penultimate word (index 1).  Else the
 * accent sits on the last word (index 0).
 */
function accentWordFromEnd(text: string): number {
  const words = tokenize(text);
  if (words.length === 0) return 0;
  const last = words[words.length - 1].toLowerCase();
  if (words.length >= 2 && CLITIC_WORDS.has(last)) {
    return 1;
  }
  return 0;
}

/**
 * Returns `true` when the second half-verse closes with a dactyl cadence.
 *
 * The dactyl pattern here spans the final two words:
 *   `[2+ syllable word stressed on its first syllable, monosyllabic clitic]`,
 * e.g. "... they **comfort me**" (COM-fort-me) in Ps 23 v4, or
 *      "... when they **tempted me**" (TEMPT-ed-me) in Ps 95 v8.
 *
 * We approximate "stressed on first syllable" with `syllableCount >= 2`,
 * which is correct for the vast majority of 2-syllable English words
 * encountered in psalm text (where trochaic is the default stress
 * pattern).  A richer detector (using a stress dictionary) is deferred to
 * Phase 2.
 */
function isDactylicEnding(text: string): boolean {
  const words = tokenize(text);
  if (words.length < 2) return false;
  const last = words[words.length - 1].toLowerCase();
  const penult = words[words.length - 2];
  if (!CLITIC_WORDS.has(last)) return false;
  return syllableCount(penult) >= 2;
}

/**
 * Flex detection: a `\n` inside the first half-verse denotes a flex at the
 * word immediately before the newline.  Return `wordFromEnd` counted over
 * the whole first half (fixtures use this encoding).
 */
function detectFlex(firstHalfText: string): VersePointing['flex'] | undefined {
  const newlineIdx = firstHalfText.indexOf('\n');
  if (newlineIdx < 0) return undefined;
  const before = firstHalfText.slice(0, newlineIdx);
  const wordsBefore = tokenize(before);
  if (wordsBefore.length === 0) return undefined;
  const allWords = tokenize(firstHalfText);
  // Word index (from start) of the last word before the newline = wordsBefore.length - 1.
  // Word-from-end = allWords.length - 1 - (wordsBefore.length - 1)
  //               = allWords.length - wordsBefore.length.
  const wordFromEnd = allWords.length - wordsBefore.length;
  return { wordFromEnd, inflected: true };
}

/**
 * Syllable count for a single word using the same vowel-group heuristic as
 * `generate-gabc.ts`.  Wraps `syllabifyText` so we stay in sync with the
 * generator's sense of "syllable".
 */
function syllableCount(word: string): number {
  const s = syllabifyText(word);
  if (s.length === 0) return 0;
  return s[0].syllables.length;
}

/**
 * Anglican convention: two-word intonation on the first verse of a psalm.
 * Phase 1 ignores `tone.intonations?.solemn` variants — those land when the
 * pointer learns to distinguish feast days (Phase 2+).
 */
function defaultIntonationWords(_tone: ToneVariant): number {
  return 2;
}
