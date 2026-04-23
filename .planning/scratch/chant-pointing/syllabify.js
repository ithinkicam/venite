// --- Constants ---
const articles = new Set(['a', 'an', 'the']);
// Matches groups of vowels including accented forms
const VOWEL_GROUP_RE = /[aeiouyáéíóúàèìòùâêîôûäëïöüīĪ]+/gi;
// Matches Unicode acute accent vowels used in psalm annotations
const ACUTE_ACCENT_RE = /[áéíóú]/;
// Leading punctuation (quotes, parens, brackets)
const LEADING_PUNCT_RE = /^["'""''(\[]+/;
// Trailing punctuation
const TRAILING_PUNCT_RE = /[.,;:!?"'""'')\]&†]+$/;
// --- Accent Utilities ---
/**
 * Returns true if the text contains any Unicode acute accent vowel.
 * These are pre-annotated in Coverdale psalm text to mark stressed syllables.
 */
export function hasAccent(text) {
    return ACUTE_ACCENT_RE.test(text);
}
/**
 * Remove acute accent marks and macrons from text.
 * á->a, é->e, í->i, ó->o, ú->u, Ī->I, ī->i
 */
export function stripAccents(text) {
    return text
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/Ī/g, 'I')
        .replace(/ī/g, 'i');
}
// --- Syllable Counting ---
/**
 * Count syllables in a word using a vowel-group heuristic.
 * Ported from psalmodia's countSyllables.
 *
 * Rules:
 * - Count vowel groups (including accented vowels)
 * - Subtract 1 for silent trailing 'e' (not 'ee', not 'le')
 * - Minimum 1 syllable
 */
export function countSyllables(word) {
    if (!word)
        return 0;
    const clean = word.toLowerCase();
    const stripped = stripAccents(clean);
    const vowelGroups = stripped.match(/[aeiouy]+/gi);
    let count = vowelGroups ? vowelGroups.length : 1;
    if (stripped.endsWith('e') &&
        count > 1 &&
        !stripped.endsWith('ee') &&
        !stripped.endsWith('le')) {
        count -= 1;
    }
    return Math.max(1, count);
}
/**
 * Split text into tokens, separating leading/trailing punctuation from the core word.
 * Ported from psalmodia's tokenize.
 */
export function tokenize(text) {
    const rawTokens = text.split(/\s+/).filter(Boolean);
    return rawTokens.map((token) => {
        var _a, _b;
        const leading = (_a = token.match(LEADING_PUNCT_RE)) === null || _a === void 0 ? void 0 : _a[0];
        const trailing = (_b = token.match(TRAILING_PUNCT_RE)) === null || _b === void 0 ? void 0 : _b[0];
        const core = token
            .replace(LEADING_PUNCT_RE, '')
            .replace(TRAILING_PUNCT_RE, '');
        return { leading, core, trailing };
    });
}
// --- Article Detection ---
/**
 * Returns true if the word is an English article (a, an, the).
 * Case insensitive.
 */
export function isArticle(word) {
    return articles.has(word.toLowerCase());
}
// --- Syllabification ---
/**
 * Split a single word into syllable segments.
 *
 * Algorithm:
 * - If monosyllabic (countSyllables <= 1), return single syllable
 * - If multi-syllable, split at consonant-vowel boundaries
 * - Each syllable checks for acute accent marks
 *
 * @param word - The word to syllabify (without surrounding punctuation)
 * @param wordIndex - Index of this word in the text (default 0)
 */
export function syllabifyWord(word, wordIndex = 0) {
    if (!word)
        return [];
    const syllableCount = countSyllables(word);
    if (syllableCount <= 1) {
        return [
            {
                text: word,
                cleanText: stripAccents(word),
                isAccented: hasAccent(word),
                wordIndex,
            },
        ];
    }
    // Find vowel group positions in the word
    const segments = splitIntoSyllables(word, syllableCount);
    return segments.map((seg) => ({
        text: seg,
        cleanText: stripAccents(seg),
        isAccented: hasAccent(seg),
        wordIndex,
    }));
}
/**
 * Split a word into the given number of syllable segments.
 * Uses vowel-group boundaries: each syllable contains one vowel group,
 * with consonants attached to the following vowel where possible.
 */
function splitIntoSyllables(word, targetCount) {
    // Find all vowel group positions
    const vowelMatches = [];
    // Use the same regex approach but on the raw word (with accents)
    const re = new RegExp(VOWEL_GROUP_RE.source, 'gi');
    let match;
    while ((match = re.exec(word)) !== null) {
        vowelMatches.push({ start: match.index, end: match.index + match[0].length });
    }
    if (vowelMatches.length <= 1) {
        return [word];
    }
    // Handle silent-e: if we have more vowel groups than target syllables,
    // merge the last vowel group with the previous one
    let effectiveVowels = vowelMatches;
    if (vowelMatches.length > targetCount) {
        // Merge extra vowel groups from the end
        effectiveVowels = vowelMatches.slice(0, targetCount);
        // Extend the last effective vowel to the end of the word
        effectiveVowels[effectiveVowels.length - 1] = {
            start: effectiveVowels[effectiveVowels.length - 1].start,
            end: word.length,
        };
    }
    // Split: each syllable boundary is placed before the consonant cluster
    // that precedes each vowel group (except the first)
    const segments = [];
    let prevEnd = 0;
    for (let i = 0; i < effectiveVowels.length; i++) {
        if (i === effectiveVowels.length - 1) {
            // Last syllable gets everything remaining
            segments.push(word.slice(prevEnd));
        }
        else {
            // Find the split point: just before the consonant cluster preceding the next vowel
            const nextVowelStart = effectiveVowels[i + 1].start;
            const currentVowelEnd = effectiveVowels[i].end;
            // Consonant cluster between this vowel group and the next
            const consonantCluster = word.slice(currentVowelEnd, nextVowelStart);
            let splitPoint;
            if (consonantCluster.length <= 1) {
                // Single consonant or no consonants: attach to next syllable
                splitPoint = currentVowelEnd;
            }
            else {
                // Multiple consonants: split before the last consonant
                // (attach leading consonant(s) to current syllable, last to next)
                splitPoint = nextVowelStart - 1;
            }
            segments.push(word.slice(prevEnd, splitPoint));
            prevEnd = splitPoint;
        }
    }
    return segments;
}
/**
 * Tokenize text into words and syllabify each word.
 * Punctuation is kept on the syllable text but not considered for accent detection.
 *
 * @param text - Full text to syllabify
 * @returns Array of word objects with their syllables
 */
export function syllabifyText(text) {
    const tokens = tokenize(text);
    const words = [];
    tokens.forEach((token, wordIndex) => {
        const core = token.core;
        if (!core)
            return;
        const syllables = syllabifyWord(core, wordIndex);
        // Re-attach leading punctuation to first syllable
        if (token.leading && syllables.length > 0) {
            syllables[0] = Object.assign(Object.assign({}, syllables[0]), { text: token.leading + syllables[0].text, cleanText: token.leading + syllables[0].cleanText });
        }
        // Re-attach trailing punctuation to last syllable
        if (token.trailing && syllables.length > 0) {
            const last = syllables.length - 1;
            syllables[last] = Object.assign(Object.assign({}, syllables[last]), { text: syllables[last].text + token.trailing, cleanText: syllables[last].cleanText + token.trailing });
        }
        // Reconstruct the full token text
        const fullText = (token.leading || '') + core + (token.trailing || '');
        words.push({
            text: fullText,
            syllables,
        });
    });
    return words;
}
