/**
 * Full verse and psalm pointing pipeline.
 *
 * Orchestrates flex, mediation, and termination pointing for complete verses,
 * and provides pointPsalm to point an entire psalm text.
 */
import { parsePsalmText } from './parse-verse';
import { pointHalfVerse } from './point-half-verse';
import { computeFlexPitch, pointFlexPortion } from './flex';
// --- pointVerse ---
/**
 * Point a single psalm verse, orchestrating flex + mediation + termination.
 *
 * If the verse has a flex (dagger):
 *   1. Point flex portion with computeFlexPitch + pointFlexPortion
 *   2. If first verse, apply intonation as post-processing on flex output
 *   3. Point mediation portion (no intonation)
 *   4. Point termination
 *
 * If no flex:
 *   1. Point first half with mediation cadence (with intonation if first verse)
 *   2. Point second half with termination cadence
 */
export function pointVerse(input) {
    const { verse, variant, differentia, isFirstVerse, mode } = input;
    if (verse.hasFlex && verse.flexText && verse.mediationText) {
        return pointVerseWithFlex(verse, variant, differentia, isFirstVerse, mode);
    }
    return pointVerseSimple(verse, variant, differentia, isFirstVerse);
}
function pointVerseSimple(verse, variant, differentia, isFirstVerse) {
    const firstHalf = pointHalfVerse(verse.firstHalf, variant.mediation.cadence, variant.recitingTone, {
        isFirstVerse,
        intonation: variant.intonation,
    });
    const secondHalf = pointHalfVerse(verse.secondHalf, differentia.termination.cadence, variant.recitingTone, { isSecondHalf: true });
    return {
        verseNumber: verse.verseNumber,
        firstHalf,
        secondHalf,
    };
}
function pointVerseWithFlex(verse, variant, differentia, isFirstVerse, mode) {
    // 1. Compute flex pitch
    const effectiveMode = mode !== null && mode !== void 0 ? mode : 1; // Default to mode 1 if not provided
    const flexPitch = computeFlexPitch(effectiveMode, variant.recitingTone);
    // 2. Point flex portion
    let flex = pointFlexPortion(verse.flexText, variant.recitingTone, flexPitch);
    // 3. If first verse, apply intonation as post-processing on flex portion
    if (isFirstVerse && variant.intonation.length > 0) {
        flex = applyIntonationToFlex(flex, variant.intonation);
    }
    // 4. Point mediation portion (NO intonation -- it went to flex)
    const firstHalf = pointHalfVerse(verse.mediationText, variant.mediation.cadence, variant.recitingTone);
    // 5. Point termination
    const secondHalf = pointHalfVerse(verse.secondHalf, differentia.termination.cadence, variant.recitingTone, { isSecondHalf: true });
    return {
        verseNumber: verse.verseNumber,
        flex,
        firstHalf,
        secondHalf,
    };
}
/**
 * Apply intonation pitches to the flex portion as post-processing.
 *
 * Iterates through the flex PointedWord[] syllables sequentially;
 * for each of the first N syllables, replaces its `notes` with
 * `[intonationPitches[i]]` and sets its `role` to `'intonation'`.
 */
function applyIntonationToFlex(flex, intonation) {
    let applied = 0;
    const n = intonation.length;
    return flex.map((word) => ({
        text: word.text,
        syllables: word.syllables.map((syl) => {
            if (applied < n) {
                const newSyl = Object.assign(Object.assign({}, syl), { notes: [intonation[applied]], role: 'intonation' });
                applied++;
                return newSyl;
            }
            return syl;
        }),
    }));
}
// --- pointPsalm ---
/**
 * Point all verses of a psalm, applying intonation to verse 1 only.
 *
 * @param input - Psalm text, tone variant, differentia, and mode
 * @returns Array of PointedVerseResult for each verse
 */
export function pointPsalm(input) {
    const { psalmText, variant, differentia, mode } = input;
    const verses = parsePsalmText(psalmText);
    return verses.map((verse, index) => pointVerse({
        verse,
        variant,
        differentia,
        isFirstVerse: index === 0,
        mode,
    }));
}
