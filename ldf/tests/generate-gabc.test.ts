import * as fs from 'fs';
import * as path from 'path';
import {
  generateGabc,
  pitchToGabcLetter,
  ToneFile,
  ToneVariant,
  Differentia,
  VersePointing,
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
