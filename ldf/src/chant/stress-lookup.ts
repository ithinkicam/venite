/**
 * stress-lookup.ts — build-time stress-syllable resolver for English words.
 *
 * Wraps the CMU Pronouncing Dictionary (`cmu-pronouncing-dictionary` v2.x,
 * shipped as a 4.7 MB JSON file with ~135 k entries). Used at *build time*
 * by `point-psalm.ts` to populate the optional `mediantStressSyllable` /
 * `finalStressSyllable` hints on `VersePointing`. The CMU JSON is **never**
 * bundled into the runtime app — it is only loaded inside the pointer
 * pipeline that runs in `scripts/batch-point-psalms.js` and the Jest test
 * suite under `ldf/`.
 *
 * Pronunciation entries are ARPABET phoneme strings with stress digits
 * appended to vowel phonemes:
 *   "0" — unstressed
 *   "1" — primary stress
 *   "2" — secondary stress
 * For example "shepherd" → "SH EH1 P ER0 D" → primary stress on syllable 0
 * (counted by the number of vowel-bearing phonemes).
 *
 * Counters track aggregate dictionary coverage so callers (e.g. the batch
 * script) can log how many lookups hit vs. missed.
 */

// Lazily-loaded dictionary. The JSON is large (~4.7 MB / 135 k entries); we
// avoid loading it until the first lookup so importing this module is cheap.
let dictionary: { [word: string]: string } | null = null;

let attempted = 0;
let succeeded = 0;

/** Reset internal counters (handy for tests). */
export function resetStressLookupStats(): void {
  attempted = 0;
  succeeded = 0;
}

/** Return current lookup stats. */
export function getStressLookupStats(): { attempted: number; succeeded: number } {
  return { attempted, succeeded };
}

function loadDictionary(): { [word: string]: string } {
  if (dictionary) return dictionary;
  try {
    // Use require so this resolves under both CJS and ESM TS output. The
    // package's `main` is `index.json`, so Node's JSON loader handles it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    dictionary = require('cmu-pronouncing-dictionary') as { [word: string]: string };
  } catch (_err) {
    // Dictionary missing (e.g. install failed). Treat all lookups as misses.
    dictionary = {};
  }
  return dictionary;
}

/**
 * Strip leading/trailing punctuation and lowercase the word.
 * Mirrors the punctuation handling used in `point-psalm.ts`'s `tokenize`.
 */
function normalize(word: string): string {
  return word.toLowerCase().replace(/^[^a-zà-ɏ'’]+|[^a-zà-ɏ'’]+$/g, '');
}

/**
 * Count the number of vowel-bearing phonemes (= number of syllables) in
 * an ARPABET phoneme string. ARPABET vowels always carry a stress digit
 * (0/1/2); consonants do not. So we just count tokens whose last character
 * is a digit.
 */
function countVowelPhonemes(phonemes: string[]): number {
  let n = 0;
  for (const p of phonemes) {
    const last = p.charCodeAt(p.length - 1);
    if (last >= 48 && last <= 57) n += 1; // ASCII '0'..'9'
  }
  return n;
}

/**
 * Return the syllable index (0-based, from start) of the LAST primary-stress
 * (`'1'`) vowel in an ARPABET phoneme string. Returns `null` if there is no
 * primary stress (rare for content words but possible for e.g. "the").
 */
function lastPrimaryStressSyllableIndex(phonemeString: string): number | null {
  const phonemes = phonemeString.trim().split(/\s+/).filter(Boolean);
  let syllableIdx = -1;
  let lastPrimary: number | null = null;
  for (const p of phonemes) {
    const last = p[p.length - 1];
    if (last >= '0' && last <= '9') {
      syllableIdx += 1;
      if (last === '1') {
        lastPrimary = syllableIdx;
      }
    }
  }
  return lastPrimary;
}

/**
 * Resolve the syllable index of the stressed syllable for a single English
 * word. Returns `null` when the word is not in the CMU dictionary so
 * callers can omit the hint and let the renderer fall back to its
 * rule-based detector.
 *
 * Hyphenated compounds (e.g. "loving-kindness") are handled by splitting on
 * `-`, looking up each part, and returning the cumulative syllable index of
 * the LAST primary-stress syllable across all parts. That matches Anglican
 * convention for chant: the accent of "loving-kindness" lands on "kind",
 * the LAST primary-stress syllable in the compound, not on "lov".
 */
export function findStressSyllableIndex(word: string): number | null {
  attempted += 1;
  const w = normalize(word);
  if (!w) return null;
  const dict = loadDictionary();

  // Hyphenated compound: walk parts, sum syllables, return cumulative index
  // of the LAST primary stress across all parts. If ANY part is missing
  // from the dict, bail and return null (callers omit the hint).
  if (w.indexOf('-') >= 0) {
    const parts = w.split('-').filter(Boolean);
    let cumulativeOffset = 0;
    let lastHit: number | null = null;
    for (const part of parts) {
      const phonemes = dict[part];
      if (typeof phonemes !== 'string') return null;
      const inner = lastPrimaryStressSyllableIndex(phonemes);
      const partSyllables = countVowelPhonemes(phonemes.trim().split(/\s+/));
      if (inner !== null) {
        lastHit = cumulativeOffset + inner;
      }
      cumulativeOffset += partSyllables;
    }
    if (lastHit !== null) succeeded += 1;
    return lastHit;
  }

  const phonemes = dict[w];
  if (typeof phonemes !== 'string') return null;
  const idx = lastPrimaryStressSyllableIndex(phonemes);
  if (idx !== null) succeeded += 1;
  return idx;
}
