/**
 * Verse parsing for psalm text.
 *
 * Handles two input formats:
 * 1. LDF verse/halfverse pairs (from Venite's liturgical data)
 * 2. Raw Coverdale psalm text (from psalmodia JSON files)
 *
 * Both formats may contain daggers (†) indicating flex points.
 */
/**
 * Parse LDF-format verse/halfverse pairs into ParsedVerse objects.
 *
 * The LDF psalm model already splits verses into `verse` (first half)
 * and `halfverse` (second half). This function adds flex detection
 * by looking for dagger (†, U+2020) in the first half.
 */
export function parseLdfVerses(sections) {
    return sections.map((section, index) => {
        var _a;
        const verseNumber = (_a = section.verseNumber) !== null && _a !== void 0 ? _a : index + 1;
        const { hasFlex, flexText, mediationText, cleanFirstHalf } = splitFlex(section.verse);
        return Object.assign({ verseNumber, firstHalf: hasFlex ? cleanFirstHalf : section.verse, secondHalf: section.halfverse, hasFlex }, (hasFlex ? { flexText, mediationText } : {}));
    });
}
// --- Coverdale Raw Text Format ---
/**
 * Trailing metadata patterns that appear at the end of psalm text.
 * These are liturgical directions, not psalm verses.
 */
const TRAILING_METADATA_RE = /\s*THE\s+(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH|THIRTEENTH|FOURTEENTH|FIFTEENTH|SIXTEENTH|SEVENTEENTH|EIGHTEENTH|NINETEENTH|TWENTIETH|TWENTY-FIRST|THIRTIETH)\s+DAY\s+(?:Morning|Evening)\s+Prayer\s*$/;
/**
 * Parse raw Coverdale psalm text into ParsedVerse objects.
 *
 * Coverdale format (from psalmodia JSON `text` field):
 * - First verse has no number prefix
 * - Subsequent verses start with a number (e.g., "2 He shall...")
 * - Half-verses are separated by newlines
 * - Daggers (†) mark flex points within a first half-verse
 * - May have trailing metadata like "THE FIFTH DAY Morning Prayer"
 *
 * @param psalmText - Raw psalm text from Coverdale JSON
 * @returns Array of ParsedVerse objects
 */
export function parsePsalmText(psalmText) {
    var _a;
    // Strip trailing metadata
    const cleaned = psalmText.replace(TRAILING_METADATA_RE, '').trim();
    // Split on newlines to get half-verse lines
    const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0)
        return [];
    // Lines alternate: first-half, second-half, first-half, second-half...
    // But second-half lines often start with a verse number for the NEXT verse
    // e.g., "and hath not sat in the seat of the scornful. 2 But his delight..."
    //
    // Actually, looking at the real data more carefully:
    // Each line is one half-verse. Lines pair up: odd lines are first halves,
    // even lines are second halves. The verse number appears at the start of
    // the first half (except verse 1 which has no number).
    //
    // But in practice, the second half often contains the start of the next verse
    // concatenated (separated by a verse number). We need to split these.
    const verses = [];
    // Parse all half-verse segments from the lines
    const segments = parseSegments(lines);
    // Pair segments into verses
    for (let i = 0; i < segments.length - 1; i += 2) {
        const firstHalf = segments[i];
        const secondHalf = segments[i + 1];
        if (!firstHalf || !secondHalf)
            break;
        const verseNum = (_a = firstHalf.verseNumber) !== null && _a !== void 0 ? _a : Math.floor(i / 2) + 1;
        const { hasFlex, flexText, mediationText, cleanFirstHalf } = splitFlex(firstHalf.text);
        verses.push(Object.assign({ verseNumber: verseNum, firstHalf: hasFlex ? cleanFirstHalf : firstHalf.text, secondHalf: secondHalf.text, hasFlex }, (hasFlex ? { flexText, mediationText } : {})));
    }
    return verses;
}
/**
 * Parse raw lines into individual half-verse segments.
 * Handles the case where multiple verse-halves appear on the same line,
 * separated by verse numbers.
 */
function parseSegments(lines) {
    const segments = [];
    for (const line of lines) {
        // Split line on verse number boundaries
        // Verse numbers appear as: ". 2 " or similar patterns
        // We need to split "...scornful. 2 But his delight..." into two segments
        const parts = splitOnVerseNumbers(line);
        for (const part of parts) {
            segments.push(part);
        }
    }
    return segments;
}
/**
 * Split a line that may contain multiple verse segments.
 * Verse numbers appear inline: "...end of verse. 3 Start of next verse..."
 */
function splitOnVerseNumbers(line) {
    // Match verse number patterns: digit(s) followed by a space and a capital letter or quote
    // But NOT at the very start of the line (first verse has no number prefix initially)
    const verseNumRe = /(?<=\.\s+|\s+)(\d+)\s+(?=[A-ZÀ-ÖØ-Þ"'(\[])/g;
    const segments = [];
    let lastIndex = 0;
    let firstVerseNumber;
    // Check if line starts with a verse number
    const startsWithNum = line.match(/^(\d+)\s+/);
    if (startsWithNum) {
        firstVerseNumber = parseInt(startsWithNum[1], 10);
        lastIndex = startsWithNum[0].length;
    }
    const matches = [];
    let m;
    while ((m = verseNumRe.exec(line)) !== null) {
        // Don't re-match the opening verse number
        if (m.index < lastIndex)
            continue;
        matches.push({
            index: m.index,
            verseNum: parseInt(m[1], 10),
            matchLength: m[0].length,
        });
    }
    if (matches.length === 0) {
        // No inline verse numbers found
        const text = line.slice(lastIndex).trim();
        if (text) {
            segments.push({ verseNumber: firstVerseNumber, text });
        }
        return segments;
    }
    // Extract text before first match
    const beforeFirst = line.slice(lastIndex, matches[0].index).trim();
    if (beforeFirst) {
        segments.push({ verseNumber: firstVerseNumber, text: beforeFirst });
    }
    // Extract segments between matches
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + matches[i].matchLength;
        const end = i + 1 < matches.length ? matches[i + 1].index : line.length;
        const text = line.slice(start, end).trim();
        if (text) {
            segments.push({ verseNumber: matches[i].verseNum, text });
        }
    }
    return segments;
}
/**
 * Split a first-half verse text on dagger (†) to extract flex and mediation portions.
 */
function splitFlex(text) {
    const daggerIndex = text.indexOf('†');
    if (daggerIndex === -1) {
        return { hasFlex: false, cleanFirstHalf: text };
    }
    const flexText = text.slice(0, daggerIndex).replace(/[,\s]+$/, '').trim();
    const mediationText = text.slice(daggerIndex + 1).replace(/^[,\s]+/, '').trim();
    // Clean first half is the full text for pointing purposes (flex + mediation combined)
    const cleanFirstHalf = `${flexText} ${mediationText}`;
    return {
        hasFlex: true,
        flexText,
        mediationText,
        cleanFirstHalf,
    };
}
