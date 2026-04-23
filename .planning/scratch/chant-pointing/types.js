import { z } from 'zod';
import { PitchSchema } from '../types/tone';
// --- Syllable Role ---
/**
 * The functional role of a syllable within a psalm tone formula.
 * Determines which pitch(es) the syllable receives during pointing.
 */
export const SyllableRoleSchema = z.enum([
    'intonation',
    'reciting',
    'flex-reciting',
    'flex-accent',
    'flex-post',
    'preparation',
    'accent',
    'post-accent',
]);
// --- Pointed Output Types ---
/**
 * A single syllable with its assigned pitch(es) after pointing.
 * Multiple pitches = melisma (all sung on one syllable).
 */
export const PointedSyllableSchema = z.object({
    text: z.string(), // Syllable text with original accent marks
    cleanText: z.string(), // Without accent marks
    notes: z.array(PitchSchema).min(1), // Pitch(es) for this syllable
    role: SyllableRoleSchema,
    isAccented: z.boolean(), // Has acute accent in source text
});
/**
 * A word composed of pointed syllables.
 */
export const PointedWordSchema = z.object({
    text: z.string(), // Original word text
    syllables: z.array(PointedSyllableSchema).min(1),
});
/**
 * A half-verse of pointed words.
 * Corresponds to one side of the colon/asterisk division.
 */
export const PointedHalfVerseSchema = z.object({
    text: z.string(), // Original half-verse text
    words: z.array(PointedWordSchema).min(1),
});
/**
 * A complete pointed verse with both halves and optional flex.
 */
export const PointedVerseSchema = z.object({
    verseNumber: z.number().int().min(1),
    firstHalf: PointedHalfVerseSchema,
    secondHalf: PointedHalfVerseSchema,
    flex: PointedHalfVerseSchema.optional(), // Present if verse has dagger
});
// --- Internal Pre-Pointing Types ---
/**
 * A raw syllable before pitch assignment.
 * Used internally by the syllabifier; the pointing algorithm
 * will convert these into PointedSyllables.
 */
export const RawSyllableSchema = z.object({
    text: z.string(), // Syllable text with accents preserved
    cleanText: z.string(), // Without accent marks
    isAccented: z.boolean(), // Has acute accent
    wordIndex: z.number(), // Index of the word this syllable belongs to
});
