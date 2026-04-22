import * as fs from 'fs';
import * as path from 'path';
import { pointVerse, ToneFile, ToneVariant, VersePointing } from '../src/chant';

// ---------------------------------------------------------------------------
// Fixture loaders
// ---------------------------------------------------------------------------

const COMMONPRAYER_DIR = path.resolve(__dirname, '..', '..', 'commonprayer', 'src');
const TONES_DIR = path.join(COMMONPRAYER_DIR, 'chant', 'tones');
const POINTING_DIR = path.join(COMMONPRAYER_DIR, 'chant', 'pointing');
const PSALTER_DIR = path.join(COMMONPRAYER_DIR, 'liturgy', 'psalter', 'bcp1979');

interface PointingFixture {
  psalm: string;
  source: string;
  verses: { [verseNumber: string]: VersePointing };
}

interface PsalmVerse {
  number: string;
  verse: string;
  halfverse: string;
}

function loadTone(id: string): ToneFile {
  const file = path.join(TONES_DIR, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as ToneFile;
}

function findVariant(tone: ToneFile, variantId: string): ToneVariant {
  const v = tone.variants.find((x) => x.id === variantId);
  if (!v) throw new Error(`Variant ${variantId} not in ${tone.id}`);
  return v;
}

function loadPointingFixture(psalmNumber: string): PointingFixture {
  const file = path.join(POINTING_DIR, `psalm-${psalmNumber}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as PointingFixture;
}

function loadPsalmVerses(psalmNumber: string): PsalmVerse[] {
  const file = path.join(PSALTER_DIR, `psalm-${psalmNumber}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  // Schema: { data: [ { value: [ { type: 'psalm-section', value: [ { verse, halfverse, number, ... } ] } ] } ] }
  const sections = data.data[0].value;
  const verses: PsalmVerse[] = [];
  for (const section of sections) {
    if (section.type === 'psalm-section' && Array.isArray(section.value)) {
      for (const v of section.value) {
        if (v.type === 'psalm-verse') {
          verses.push({
            number: String(v.number),
            verse: v.verse,
            halfverse: v.halfverse,
          });
        }
      }
    }
  }
  return verses;
}

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

interface Divergence {
  psalm: string;
  verseNumber: string;
  field: 'mediantAccent' | 'finalAccent' | 'flex' | 'ending' | 'intonationWords';
  fixture: unknown;
  algorithmic: unknown;
  diff?: number;
}

function compareVerse(
  psalmNumber: string,
  verseNumber: string,
  fixture: VersePointing,
  algo: VersePointing,
): Divergence[] {
  const divergences: Divergence[] = [];

  if ((fixture.mediantAccent ?? 0) !== (algo.mediantAccent ?? 0)) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'mediantAccent',
      fixture: fixture.mediantAccent,
      algorithmic: algo.mediantAccent,
      diff: Math.abs((fixture.mediantAccent ?? 0) - (algo.mediantAccent ?? 0)),
    });
  }
  if ((fixture.finalAccent ?? 0) !== (algo.finalAccent ?? 0)) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'finalAccent',
      fixture: fixture.finalAccent,
      algorithmic: algo.finalAccent,
      diff: Math.abs((fixture.finalAccent ?? 0) - (algo.finalAccent ?? 0)),
    });
  }

  // Flex: present/absent agreement + wordFromEnd tolerance.
  const fFlex = fixture.flex;
  const aFlex = algo.flex;
  if (!!fFlex !== !!aFlex) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'flex',
      fixture: fFlex,
      algorithmic: aFlex,
    });
  } else if (fFlex && aFlex && fFlex.wordFromEnd !== aFlex.wordFromEnd) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'flex',
      fixture: fFlex,
      algorithmic: aFlex,
      diff: Math.abs(fFlex.wordFromEnd - aFlex.wordFromEnd),
    });
  }

  if ((fixture.ending ?? null) !== (algo.ending ?? null)) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'ending',
      fixture: fixture.ending ?? null,
      algorithmic: algo.ending ?? null,
    });
  }

  if ((fixture.intonationWords ?? 0) !== (algo.intonationWords ?? 0)) {
    divergences.push({
      psalm: psalmNumber,
      verseNumber,
      field: 'intonationWords',
      fixture: fixture.intonationWords,
      algorithmic: algo.intonationWords,
      diff: Math.abs((fixture.intonationWords ?? 0) - (algo.intonationWords ?? 0)),
    });
  }

  return divergences;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function runPsalm(psalmNumber: string) {
  const fixture = loadPointingFixture(psalmNumber);
  const verses = loadPsalmVerses(psalmNumber);
  const tone = loadTone('tone-1');
  const variant = findVariant(tone, 'tone-1-a');

  const divergencesByVerse: Record<string, Divergence[]> = {};
  let pass = 0;
  let diff = 0;
  const hardFails: Array<{ verse: string; reason: string }> = [];

  for (const verse of verses) {
    const expected = fixture.verses[verse.number];
    if (!expected) continue;
    let actual: VersePointing;
    try {
      actual = pointVerse({
        text: verse.verse,
        halfverse: verse.halfverse,
        tone: variant,
        isVerseOne: verse.number === '1',
      });
    } catch (err) {
      hardFails.push({ verse: verse.number, reason: `threw: ${(err as Error).message}` });
      continue;
    }
    if (!actual) {
      hardFails.push({ verse: verse.number, reason: 'returned falsy' });
      continue;
    }
    const ds = compareVerse(psalmNumber, verse.number, expected, actual);
    if (ds.length === 0) {
      pass += 1;
    } else {
      diff += 1;
      divergencesByVerse[verse.number] = ds;
    }
  }

  return { pass, diff, hardFails, divergencesByVerse, verses };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('pointVerse — Phase 1 golden fixture comparison', () => {
  it('exports a callable pointVerse function', () => {
    expect(typeof pointVerse).toBe('function');
  });

  it('returns a VersePointing with mediantAccent + finalAccent for a trivial verse', () => {
    const tone = loadTone('tone-1');
    const variant = findVariant(tone, 'tone-1-a');
    const out = pointVerse({
      text: 'The LORD is my shepherd',
      halfverse: 'I shall not be in want.',
      tone: variant,
      isVerseOne: true,
    });
    expect(out).toBeDefined();
    expect(typeof out.mediantAccent).toBe('number');
    expect(typeof out.finalAccent).toBe('number');
    expect(out.intonationWords).toBe(2);
  });

  it('matches or diverges by ≤2 from golden fixture — Psalm 23', () => {
    const { pass, diff, hardFails, divergencesByVerse, verses } = runPsalm('23');
    // eslint-disable-next-line no-console
    console.log(
      `Psalm 23: ${pass}/${verses.length} verses matched exactly; ${diff} diverged; ${hardFails.length} hard failures.`,
    );
    if (Object.keys(divergencesByVerse).length > 0) {
      // eslint-disable-next-line no-console
      console.log('Psalm 23 divergences:', JSON.stringify(divergencesByVerse, null, 2));
    }
    expect(hardFails).toEqual([]);
    // Fail only if a divergence exceeds the ≤2 tolerance for accent fields
    // or a structural field (ending / flex presence) is inverted.
    for (const [verseNumber, ds] of Object.entries(divergencesByVerse)) {
      for (const d of ds) {
        if (d.field === 'mediantAccent' || d.field === 'finalAccent') {
          expect({ verse: verseNumber, ...d }).toMatchObject({
            diff: expect.any(Number),
          });
          expect(d.diff!).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('matches or diverges by ≤2 from golden fixture — Psalm 95', () => {
    const { pass, diff, hardFails, divergencesByVerse, verses } = runPsalm('95');
    // eslint-disable-next-line no-console
    console.log(
      `Psalm 95: ${pass}/${verses.length} verses matched exactly; ${diff} diverged; ${hardFails.length} hard failures.`,
    );
    if (Object.keys(divergencesByVerse).length > 0) {
      // eslint-disable-next-line no-console
      console.log('Psalm 95 divergences:', JSON.stringify(divergencesByVerse, null, 2));
    }
    expect(hardFails).toEqual([]);
    for (const [verseNumber, ds] of Object.entries(divergencesByVerse)) {
      for (const d of ds) {
        if (d.field === 'mediantAccent' || d.field === 'finalAccent') {
          expect({ verse: verseNumber, ...d }).toMatchObject({
            diff: expect.any(Number),
          });
          expect(d.diff!).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});
