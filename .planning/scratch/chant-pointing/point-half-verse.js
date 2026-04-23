import { syllabifyText, isArticle } from './syllabify';
// --- Main function ---
/**
 * Point a half-verse of psalm text against a cadence formula.
 *
 * Maps every syllable to its pitch(es) and role using
 * back-to-front anchor on the accent NeumeGroup.
 *
 * @param text - Half-verse text with pre-annotated acute accents
 * @param cadence - NeumeGroup[] from mediation or termination
 * @param recitingTone - The reciting tone pitch for this half
 * @param options - Intonation, first-verse, second-half flags
 * @returns PointedWord[] with every syllable assigned
 */
export function pointHalfVerse(text, cadence, recitingTone, options) {
    var _a, _b;
    const { isFirstVerse = false, intonation, isSecondHalf = false, } = options !== null && options !== void 0 ? options : {};
    // 1. Syllabify text
    const words = syllabifyText(text);
    // 2. Flatten all syllables
    const flat = words.flatMap((w) => w.syllables.map((s) => ({
        text: s.text,
        cleanText: s.cleanText,
        isAccented: s.isAccented,
        wordIndex: s.wordIndex,
        notes: [],
        role: 'reciting',
    })));
    if (flat.length === 0) {
        return [];
    }
    // 3. Peregrinus detection
    let workingCadence = [...cadence];
    let peregrinusGroup = null;
    let effectiveRecitingTone = recitingTone;
    if (isSecondHalf && workingCadence.length > 0 && workingCadence[0].role === 'reciting') {
        peregrinusGroup = workingCadence[0];
        effectiveRecitingTone = peregrinusGroup.notes[0];
        workingCadence = workingCadence.slice(1);
    }
    // 4. Separate cadence groups by role
    const prepGroups = workingCadence.filter((g) => g.role === 'preparation');
    const accentGroup = workingCadence.find((g) => g.role === 'accent');
    const postGroups = workingCadence.filter((g) => g.role === 'post-accent');
    if (!accentGroup) {
        // No accent group -- assign everything as reciting tone
        for (const s of flat) {
            s.notes = [effectiveRecitingTone];
            s.role = 'reciting';
        }
        return reconstructWords(words, flat);
    }
    // 5. Find anchor: last accented syllable scanning from end
    let anchorIdx = -1;
    for (let i = flat.length - 1; i >= 0; i--) {
        if (flat[i].isAccented) {
            anchorIdx = i;
            break;
        }
    }
    // If no accented syllable, use last syllable
    if (anchorIdx === -1) {
        anchorIdx = flat.length - 1;
    }
    // Article check: if anchor syllable's word is an article, try next syllable
    const anchorWordText = (_b = (_a = words[flat[anchorIdx].wordIndex]) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : '';
    if (isArticle(anchorWordText) && anchorIdx + 1 < flat.length) {
        anchorIdx = anchorIdx + 1;
    }
    // 6. Calculate cadence region boundaries
    const totalCadenceSlots = prepGroups.length + 1 + postGroups.length; // prep + accent + post
    // Short verse handling: drop prep groups from front if needed
    let effectivePrepCount = prepGroups.length;
    const syllablesAvailable = flat.length;
    if (syllablesAvailable < totalCadenceSlots) {
        // Drop prep groups from front (closest to reciting tone) first
        const deficit = totalCadenceSlots - syllablesAvailable;
        effectivePrepCount = Math.max(0, prepGroups.length - deficit);
    }
    // Determine the effective prep groups (keep from back = closest to accent)
    const effectivePrepGroups = prepGroups.slice(prepGroups.length - effectivePrepCount);
    // 7. Assign accent
    flat[anchorIdx].notes = [...accentGroup.notes];
    flat[anchorIdx].role = 'accent';
    // 8. Assign post-accent syllables (after anchor)
    const postStartIdx = anchorIdx + 1;
    const postSyllables = flat.length - postStartIdx;
    if (postSyllables > 0 && postGroups.length > 0) {
        if (postSyllables >= postGroups.length) {
            // Enough syllables for all post-accent groups
            for (let i = 0; i < postGroups.length; i++) {
                flat[postStartIdx + i].notes = [...postGroups[i].notes];
                flat[postStartIdx + i].role = 'post-accent';
            }
            // Trailing syllables after post-accent groups get last pitch
            const lastPostNote = postGroups[postGroups.length - 1].notes;
            const lastPitch = lastPostNote[lastPostNote.length - 1];
            for (let i = postGroups.length; i < postSyllables; i++) {
                flat[postStartIdx + i].notes = [lastPitch];
                flat[postStartIdx + i].role = 'post-accent';
            }
        }
        else {
            // Fewer syllables than post-accent groups
            // Assign one-to-one, then merge remaining groups onto last syllable
            for (let i = 0; i < postSyllables - 1; i++) {
                flat[postStartIdx + i].notes = [...postGroups[i].notes];
                flat[postStartIdx + i].role = 'post-accent';
            }
            // Last post-accent syllable gets all remaining groups merged
            const lastPostSyllIdx = postStartIdx + postSyllables - 1;
            const remainingNotes = [];
            for (let i = postSyllables - 1; i < postGroups.length; i++) {
                remainingNotes.push(...postGroups[i].notes);
            }
            flat[lastPostSyllIdx].notes = remainingNotes;
            flat[lastPostSyllIdx].role = 'post-accent';
        }
    }
    else if (postSyllables > 0 && postGroups.length === 0) {
        // No post-accent groups but trailing syllables exist -> last cadence pitch
        const lastAccentNote = accentGroup.notes[accentGroup.notes.length - 1];
        for (let i = postStartIdx; i < flat.length; i++) {
            flat[i].notes = [lastAccentNote];
            flat[i].role = 'post-accent';
        }
    }
    // 9. Assign preparation syllables (working backward from anchor)
    const prepEndIdx = anchorIdx - 1; // last prep syllable is right before accent
    for (let i = 0; i < effectivePrepCount; i++) {
        const syllIdx = prepEndIdx - i;
        if (syllIdx >= 0) {
            // effectivePrepGroups are in order [closest-to-reciting ... closest-to-accent]
            // We assign from closest-to-accent backward
            const groupIdx = effectivePrepCount - 1 - i;
            flat[syllIdx].notes = [...effectivePrepGroups[groupIdx].notes];
            flat[syllIdx].role = 'preparation';
        }
    }
    // 10. Assign reciting tone to all unassigned syllables before preparation
    const firstPrepIdx = anchorIdx - effectivePrepCount;
    for (let i = 0; i < firstPrepIdx; i++) {
        flat[i].notes = [effectiveRecitingTone];
        flat[i].role = 'reciting';
    }
    // 11. Apply Peregrinus ornament: first reciting syllable gets the ornament
    if (peregrinusGroup) {
        const firstRecitingIdx = flat.findIndex((s) => s.role === 'reciting');
        if (firstRecitingIdx >= 0) {
            flat[firstRecitingIdx].notes = [...peregrinusGroup.notes];
            // Keep role as 'reciting'
        }
    }
    // 12. Apply intonation: replace first N reciting syllables
    if (isFirstVerse && intonation && intonation.length > 0) {
        let applied = 0;
        for (let i = 0; i < flat.length && applied < intonation.length; i++) {
            if (flat[i].role === 'reciting') {
                flat[i].notes = [intonation[applied]];
                flat[i].role = 'intonation';
                applied++;
            }
            else {
                // Stop at first non-reciting syllable (don't cross into cadence)
                break;
            }
        }
    }
    return reconstructWords(words, flat);
}
// --- Reconstruct PointedWord[] from flat syllables ---
function reconstructWords(originalWords, flat) {
    const result = [];
    let flatIdx = 0;
    for (const word of originalWords) {
        const syllables = [];
        for (let i = 0; i < word.syllables.length; i++) {
            const fs = flat[flatIdx];
            syllables.push({
                text: fs.text,
                cleanText: fs.cleanText,
                notes: fs.notes,
                role: fs.role,
                isAccented: fs.isAccented,
            });
            flatIdx++;
        }
        result.push({
            text: word.text,
            syllables,
        });
    }
    return result;
}
