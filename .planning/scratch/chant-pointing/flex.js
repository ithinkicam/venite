import { syllabifyText, isArticle } from './syllabify';
// --- Constants ---
const DIATONIC = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const WHOLE_STEP_MODES = new Set([1, 4, 7, 0]);
// --- Flex Pitch Computation ---
/**
 * Compute the flex pitch by dropping diatonically from the reciting tone.
 *
 * - Modes 1, 4, 7, 0: whole step (1 diatonic step down)
 * - Modes 2, 3, 5, 6, 8: minor third (2 diatonic steps down)
 *
 * Special case: Mode 7 drops C -> Bb (adds accidental 'b').
 */
export function computeFlexPitch(mode, recitingTone) {
    const steps = WHOLE_STEP_MODES.has(mode) ? 1 : 2;
    const noteIdx = DIATONIC.indexOf(recitingTone.note);
    const newIdx = noteIdx - steps;
    if (newIdx < 0) {
        // Crossed below C -- wrap to previous octave
        const wrappedIdx = newIdx + 7;
        const newOctave = recitingTone.octave - 1;
        const newNote = DIATONIC[wrappedIdx];
        // Mode 7 special case: C -> B needs Bb accidental
        const accidental = mode === 7 ? 'b' : undefined;
        return accidental
            ? { note: newNote, octave: newOctave, accidental }
            : { note: newNote, octave: newOctave };
    }
    return { note: DIATONIC[newIdx], octave: recitingTone.octave };
}
// --- Flex Portion Pointing ---
/**
 * Point the flex portion of a psalm verse (text before the dagger).
 *
 * 1. Syllabify the text
 * 2. Find the last accented syllable (pre-annotated acute accent)
 * 3. If no accent found, fallback: last non-article content word, first syllable
 * 4. Assign roles: flex-reciting before anchor, flex-accent on anchor, flex-post after
 */
export function pointFlexPortion(text, recitingTone, flexPitch) {
    const words = syllabifyText(text);
    // Flatten all syllables
    const flat = words.flatMap((w) => w.syllables.map((s) => ({
        text: s.text,
        cleanText: s.cleanText,
        isAccented: s.isAccented,
        wordIndex: s.wordIndex,
        notes: [],
        role: 'flex-reciting',
    })));
    if (flat.length === 0) {
        return [];
    }
    // Find anchor: last accented syllable scanning from end
    let anchorIdx = findAccentAnchor(flat, words);
    // Assign roles
    for (let i = 0; i < flat.length; i++) {
        if (i < anchorIdx) {
            flat[i].role = 'flex-reciting';
            flat[i].notes = [recitingTone];
        }
        else if (i === anchorIdx) {
            flat[i].role = 'flex-accent';
            flat[i].notes = [flexPitch];
        }
        else {
            flat[i].role = 'flex-post';
            flat[i].notes = [flexPitch];
        }
    }
    return reconstructWords(words, flat);
}
// --- Accent Anchor Finding ---
/**
 * Find the index of the anchor syllable in the flat array.
 *
 * Strategy:
 * 1. Scan from end for pre-annotated accents (isAccented === true)
 * 2. If none found, fallback: scan words from end, skip articles,
 *    use first syllable of last content word
 * 3. If all words are articles, use last word
 */
function findAccentAnchor(flat, words) {
    var _a;
    // Strategy 1: Last pre-annotated accent
    for (let i = flat.length - 1; i >= 0; i--) {
        if (flat[i].isAccented) {
            return i;
        }
    }
    // Strategy 2: Fallback -- last non-article content word, first syllable
    // Scan words from end
    for (let w = words.length - 1; w >= 0; w--) {
        const wordText = words[w].text;
        // Strip punctuation from word to check if it's an article
        const coreText = wordText.replace(/[.,;:!?"'""''()\[\]&†]+/g, '').trim();
        if (isArticle(coreText)) {
            continue;
        }
        // Found a content word -- find its first syllable in the flat array
        const wordIndex = (_a = words[w].syllables[0]) === null || _a === void 0 ? void 0 : _a.wordIndex;
        if (wordIndex !== undefined) {
            const firstSylIdx = flat.findIndex((s) => s.wordIndex === wordIndex);
            if (firstSylIdx >= 0) {
                return firstSylIdx;
            }
        }
    }
    // Strategy 3: Degenerate case -- all articles, use last word's first syllable
    return flat.length - 1;
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
