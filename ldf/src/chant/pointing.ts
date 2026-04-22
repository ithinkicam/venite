/**
 * Per-verse pointing marks for chant rendering.
 *
 * - `mediantAccent` / `finalAccent`: syllable-from-end indices for the
 *   accented syllable in the mediation / termination cadences.
 * - `caesura`: optional word-from-start index marking a caesura (light break)
 *   within the first or second half of a verse.
 * - `flex`: when a single-line verse needs a flex mid-verse, identifies the
 *   word-from-end and whether it's inflected.
 * - `preparatorySyllables`: syllables-from-end indices that receive
 *   preparatory notes before the accent(s).
 * - `intonationWords`: number of words from the start that carry the
 *   intonation formula (used on the first verse of a psalm).
 * - `ending`: optional classification of the final cadence pattern,
 *   e.g. `'dactylic'`.
 */
export interface VersePointing {
  mediantAccent?: number;
  finalAccent?: number;
  caesura?: number;
  flex?: { wordFromEnd: number; inflected: boolean };
  preparatorySyllables?: number[];
  intonationWords?: number;
  ending?: 'dactylic';
}

/**
 * A complete pointing set for one psalm, keyed by verse number (string).
 * Keyed by string to match `PsalmVerse.number` (string today).
 */
export interface PsalmPointing {
  verses: { [verseNumber: string]: VersePointing };
}
