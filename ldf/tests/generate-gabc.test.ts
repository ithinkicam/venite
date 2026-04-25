import * as fs from 'fs';
import * as path from 'path';
import {
  generateGabc,
  generatePitchSequence,
  pitchToGabcLetter,
  ToneFile,
  ToneVariant,
  Differentia,
  VersePointing,
  NeumeGroup,
} from '../src/chant';

// ---------------------------------------------------------------------------
// Fixture loaders
// ---------------------------------------------------------------------------

const TONES_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'commonprayer',
  'src',
  'chant',
  'tones',
);

function loadTone(id: string): ToneFile {
  const file = path.join(TONES_DIR, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as ToneFile;
}

function findVariant(tone: ToneFile, variantId: string): ToneVariant {
  const v = tone.variants.find((x) => x.id === variantId);
  if (!v) throw new Error(`Variant ${variantId} not found in ${tone.id}`);
  return v;
}

function findDifferentia(variant: ToneVariant, id: string): Differentia {
  const d = variant.differentiae.find((x) => x.id === id);
  if (!d) throw new Error(`Differentia ${id} not found in ${variant.id}`);
  return d;
}

// ---------------------------------------------------------------------------
// pitchToGabcLetter (c4 clef sanity checks)
// ---------------------------------------------------------------------------

describe('pitchToGabcLetter (c4 clef)', () => {
  it('maps A3 -> h', () => {
    expect(pitchToGabcLetter({ note: 'A', octave: 3 })).toBe('h');
  });
  it('maps G3 -> g, F3 -> f, D3 -> d', () => {
    expect(pitchToGabcLetter({ note: 'G', octave: 3 })).toBe('g');
    expect(pitchToGabcLetter({ note: 'F', octave: 3 })).toBe('f');
    expect(pitchToGabcLetter({ note: 'D', octave: 3 })).toBe('d');
  });
  it('maps C4 -> j (middle C under c4 clef)', () => {
    expect(pitchToGabcLetter({ note: 'C', octave: 4 })).toBe('j');
  });
});

// ---------------------------------------------------------------------------
// Test 1: Tone I A ending 4 on Ps 23 v1
// ---------------------------------------------------------------------------

describe('generateGabc — Tone I A / ending 4 / Ps 23 v1', () => {
  it('emits a valid GABC fragment for the first verse', () => {
    const tone1 = loadTone('tone-1');
    const variant = findVariant(tone1, 'tone-1-a');
    const differentia = findDifferentia(variant, '4');

    const pointedVerse: VersePointing = {
      mediantAccent: 1,
      finalAccent: 1,
      intonationWords: 2,
    };

    const out = generateGabc({
      tone: variant,
      differentia,
      pointedVerse,
      text: 'The Lord is my shepherd; I shall not be in want.',
    });

    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    expect(out.startsWith('(c4)')).toBe(true);
    expect(out.endsWith('(::)')).toBe(true);
    expect(out).toContain('Lord');
    // Caesura between halves should be present.
    expect(out).toContain('*(:)');
  });
});

// ---------------------------------------------------------------------------
// Test 2: Peregrinus on Ps 114 v1 (two reciting notes)
// ---------------------------------------------------------------------------

describe('generateGabc — Tonus Peregrinus on Ps 114 v1', () => {
  it('emits a valid GABC fragment and handles two reciting notes', () => {
    const toneP = loadTone('tone-peregrinus');
    const variant = findVariant(toneP, 'tone-peregrinus-a');
    // Peregrinus variant in this repo has `secondRecitingTone` set.
    expect(variant.secondRecitingTone).toBeDefined();

    const differentia = variant.differentiae[0];
    const pointedVerse: VersePointing = {
      mediantAccent: 1,
      finalAccent: 1,
      intonationWords: 2,
    };

    const out = generateGabc({
      tone: variant,
      differentia,
      pointedVerse,
      text:
        'When Israel came out of Egypt, * the house of Jacob from a people of strange language,',
    });

    expect(out.startsWith('(c4)')).toBe(true);
    expect(out.endsWith('(::)')).toBe(true);
    // Syllabification may split "Israel" into "Is"+"rael" — match the stem.
    expect(out).toMatch(/Is\b|Is\(/);
    expect(out).toMatch(/Ja\b|Ja\(/);
    expect(out).toContain('*(:)');
  });
});

// ---------------------------------------------------------------------------
// Test 3: Flex applied to a long verse
// ---------------------------------------------------------------------------

describe('generateGabc — flex handling on long verse', () => {
  it('emits a flex marker somewhere in the first half', () => {
    const tone1 = loadTone('tone-1');
    const variant = findVariant(tone1, 'tone-1-a');
    const differentia = findDifferentia(variant, '4');

    const pointedVerse: VersePointing = {
      mediantAccent: 1,
      finalAccent: 1,
      flex: { wordFromEnd: 5, inflected: true },
    };

    const out = generateGabc({
      tone: variant,
      differentia,
      pointedVerse,
      text:
        'A very long verse with enough words that the flex is applied partway through the first half before the caesura.',
    });

    expect(out.startsWith('(c4)')).toBe(true);
    expect(out.endsWith('(::)')).toBe(true);
    // Flex marker convention (Phase 1): emit `(;)` inline in the first half.
    expect(out).toContain('(;)');
  });
});

// ---------------------------------------------------------------------------
// Test 4: Cadence alignment respects `mediantStressSyllable`
// (regression test for the stress-aware fix)
// ---------------------------------------------------------------------------

describe('generateGabc — cadence aligns to stressed syllable', () => {
  it('places Tone I A mediation accent on "shep" of "shepherd", not "herd"', () => {
    // Tone 1 A mediation: [preparation:G3, accent:A3]
    // Reciting tone: A3.
    // With mediantStressSyllable=0 (SHEP-herd), the accent neume (A3=h) should
    // land on "shep" and the preparation neume (G3=g) on the preceding syllable
    // ("my"). Before the fix, the preparation was placed on "shep" and the
    // accent on "herd" — i.e. stress in the WRONG place for English prosody.
    const tone1 = loadTone('tone-1');
    const variant = findVariant(tone1, 'tone-1-a');
    const differentia = findDifferentia(variant, '1');

    const pointedVerse: VersePointing = {
      mediantAccent: 0, // "shepherd" is the last word of the first half
      finalAccent: 0, // "want" is the last word of the second half
      mediantStressSyllable: 0, // stress on first syllable of "shepherd"
      finalStressSyllable: 0,
      // No intonation for this half so we can see the cadence syllables
      // without interference.
    };

    const out = generateGabc({
      tone: variant,
      differentia,
      pointedVerse,
      text: 'The Lord is my shepherd; * I shall not be in want.',
    });

    // Preparation (G3=g) lands on "my" — the syllable BEFORE the stressed one.
    expect(out).toContain('my(g)');
    // Accent (A3=h) lands on "shep" (first syllable of "shepherd").
    expect(out).toContain('shep(h)');
    // "herd" stays on the reciting tone (also A3=h here; we assert it's not g).
    expect(out).not.toMatch(/shep\(g\)/);
    expect(out).not.toMatch(/herd;?\(g\)/);

    // Second half: termination diff 1 = [prep:G3, accent:F3, post:E3, post:D3].
    // finalStressSyllable=0 on "want" (single syllable, last word) places
    // accent (F3=f) on "want" and preparation (G3=g) on "in". Post-accent
    // groups overflow past the end and are dropped.
    expect(out).toContain('in(g)');
    expect(out).toContain('want.(f)');
  });
});

// ---------------------------------------------------------------------------
// Test 5: Fallback behavior when cadence has no `accent`-role group
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// generatePitchSequence smoke
// ---------------------------------------------------------------------------

describe('generatePitchSequence — Tone I A / Ps 23 v1', () => {
  it('returns a syllable stream with one caesura entry and pitched syllables', () => {
    const tone1 = loadTone('tone-1');
    const variant = findVariant(tone1, 'tone-1-a');
    const differentia = findDifferentia(variant, '4');

    const pointedVerse: VersePointing = {
      mediantAccent: 0,
      finalAccent: 0,
      mediantStressSyllable: 0,
      finalStressSyllable: 0,
      intonationWords: 2,
    };

    const seq = generatePitchSequence({
      tone: variant,
      differentia,
      pointedVerse,
      text: 'The Lord is my shepherd; * I shall not be in want.',
    });

    // Sanity: non-empty.
    expect(seq.length).toBeGreaterThan(0);

    // Exactly one caesura entry, with empty pitches and text === '*'.
    const caesuras = seq.filter((s) => s.isCaesura);
    expect(caesuras.length).toBe(1);
    expect(caesuras[0].pitches).toEqual([]);
    expect(caesuras[0].text).toBe('*');

    // Total pitches across all syllables > 0.
    const totalPitches = seq.reduce((acc, s) => acc + s.pitches.length, 0);
    expect(totalPitches).toBeGreaterThan(0);

    // Every non-caesura syllable should carry at least one pitch (reciting
    // tone is the floor) and a non-empty `text`.
    for (const s of seq) {
      if (s.isCaesura) continue;
      expect(s.text.length).toBeGreaterThan(0);
      expect(s.pitches.length).toBeGreaterThan(0);
    }
  });
});

describe('generateGabc — fallback when no accent role in cadence', () => {
  it('uses legacy "last N syllables" alignment when cadence is accent-less', () => {
    // Synthetic tone-variant + differentia with an all-preparation cadence
    // (no `accent` role anywhere). The fix's stress-aware path should fall
    // back to aligning cadence groups to the last N syllables of the half.
    const variant: ToneVariant = {
      id: 'synthetic',
      label: 'synthetic',
      isDefault: true,
      mediationVariant: 'standard',
      intonation: [],
      recitingTone: { note: 'A', octave: 3 }, // h
      mediation: {
        // Purely preparation groups — no accent. Forces the fallback branch.
        cadence: [
          { notes: [{ note: 'G', octave: 3 }], role: 'preparation' }, // g
          { notes: [{ note: 'F', octave: 3 }], role: 'preparation' }, // f
        ] as NeumeGroup[],
      },
      differentiae: [],
    };
    const differentia: Differentia = {
      id: 'synthetic-end',
      label: 'synthetic-end',
      termination: {
        // Purely post-accent groups — no accent. Forces fallback.
        cadence: [
          { notes: [{ note: 'E', octave: 3 }], role: 'post-accent' }, // e
          { notes: [{ note: 'D', octave: 3 }], role: 'post-accent' }, // d
        ] as NeumeGroup[],
      },
    };

    const pointedVerse: VersePointing = {
      // These hints should be IGNORED on the fallback path.
      mediantAccent: 0,
      finalAccent: 0,
      mediantStressSyllable: 0,
      finalStressSyllable: 0,
    };

    const out = generateGabc({
      tone: variant,
      differentia,
      pointedVerse,
      // Three + three = six words; one syllable each.
      text: 'foo bar baz * qux quux quuz',
    });

    // First half: legacy fallback places [prep:G, prep:F] on the last two
    // syllables → "bar(g) baz(f)".
    expect(out).toContain('bar(g)');
    expect(out).toContain('baz(f)');
    // Second half: [post:E, post:D] on the last two syllables → "quux(e) quuz(d)".
    expect(out).toContain('quux(e)');
    expect(out).toContain('quuz(d)');
  });
});
