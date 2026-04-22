import * as fs from 'fs';
import * as path from 'path';

/**
 * W1.10 — Tone-library structural validation test.
 *
 * Loads all 9 tone JSON files from `commonprayer/src/chant/tones/` and asserts
 * they structurally satisfy the `ToneFile` / `ToneVariant` / `NeumeGroup`
 * contracts defined in `ldf/src/chant/*`.
 *
 * Copyright guardrail: every file's `_comment` must name `public domain` and
 * reference `Andrewes Press 2002` only as a verification reference.
 */

const TONES_DIR = path.resolve(__dirname, '../../commonprayer/src/chant/tones');

const TONE_FILES = [
  'tone-1.json',
  'tone-2.json',
  'tone-3.json',
  'tone-4.json',
  'tone-5.json',
  'tone-6.json',
  'tone-7.json',
  'tone-8.json',
  'tone-peregrinus.json',
];

const ID_REGEX = /^tone-(1|2|3|4|5|6|7|8|peregrinus)$/;
const VALID_ROLES = ['intonation', 'reciting', 'preparation', 'accent', 'post-accent'];
const VALID_MEDIATION_VARIANTS = ['standard', 'abrupt'];

type ToneData = {
  id: string;
  mode: number | string;
  name: string;
  variants: any[];
  _comment?: string;
};

const toneCases: Array<{ file: string; data: ToneData }> = TONE_FILES.map((file) => {
  const full = path.join(TONES_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  return { file, data: JSON.parse(raw) as ToneData };
});

function assertPitch(p: any, ctx: string): void {
  expect(typeof p).toBe('object');
  expect(p).not.toBeNull();
  expect(typeof p.note).toBe('string');
  expect(typeof p.octave).toBe('number');
}

function assertNeumeGroup(ng: any, ctx: string): void {
  expect(Array.isArray(ng.notes)).toBe(true);
  expect(ng.notes.length).toBeGreaterThanOrEqual(1);
  ng.notes.forEach((n: any) => assertPitch(n, `${ctx}.notes`));
  expect(VALID_ROLES).toContain(ng.role);
}

describe('Tone Library', () => {
  it('loads all 9 tone files from commonprayer/src/chant/tones/', () => {
    expect(toneCases.length).toBe(9);
    toneCases.forEach(({ data }) => expect(data).toBeDefined());
  });

  describe.each(toneCases)('tone file %#: $file', ({ file, data }) => {
    it('has a string id matching /^tone-(1|2|3|4|5|6|7|8|peregrinus)$/', () => {
      expect(typeof data.id).toBe('string');
      expect(data.id).toMatch(ID_REGEX);
    });

    it('has mode that is a number or the literal string "peregrinus"', () => {
      const ok = typeof data.mode === 'number' || data.mode === 'peregrinus';
      expect(ok).toBe(true);
    });

    it('has a string name', () => {
      expect(typeof data.name).toBe('string');
      expect(data.name.length).toBeGreaterThan(0);
    });

    it('has a variants array with at least one variant', () => {
      expect(Array.isArray(data.variants)).toBe(true);
      expect(data.variants.length).toBeGreaterThanOrEqual(1);
    });

    it('has exactly one variant marked isDefault: true', () => {
      const defaults = data.variants.filter((v: any) => v.isDefault === true);
      expect(defaults.length).toBe(1);
    });

    it('every variant has a mediationVariant in {standard, abrupt}', () => {
      data.variants.forEach((v: any) => {
        expect(typeof v.mediationVariant).toBe('string');
        expect(VALID_MEDIATION_VARIANTS).toContain(v.mediationVariant);
      });
    });

    it('every variant has a recitingTone with note and octave', () => {
      data.variants.forEach((v: any, i: number) => {
        assertPitch(v.recitingTone, `${file} variant[${i}].recitingTone`);
      });
    });

    it('every variant has an intonation: Pitch[]', () => {
      data.variants.forEach((v: any, i: number) => {
        expect(Array.isArray(v.intonation)).toBe(true);
        v.intonation.forEach((p: any) => assertPitch(p, `${file} variant[${i}].intonation`));
      });
    });

    it('every variant has mediation.cadence: NeumeGroup[]', () => {
      data.variants.forEach((v: any, i: number) => {
        expect(v.mediation).toBeDefined();
        expect(Array.isArray(v.mediation.cadence)).toBe(true);
        v.mediation.cadence.forEach((ng: any) =>
          assertNeumeGroup(ng, `${file} variant[${i}].mediation.cadence`),
        );
      });
    });

    it('every variant has differentiae: Differentia[] with valid neume groups in terminations', () => {
      data.variants.forEach((v: any, i: number) => {
        expect(Array.isArray(v.differentiae)).toBe(true);
        v.differentiae.forEach((diff: any, j: number) => {
          expect(typeof diff.id).toBe('string');
          expect(typeof diff.label).toBe('string');
          expect(diff.termination).toBeDefined();
          expect(Array.isArray(diff.termination.cadence)).toBe(true);
          diff.termination.cadence.forEach((ng: any) =>
            assertNeumeGroup(
              ng,
              `${file} variant[${i}].differentiae[${j}].termination.cadence`,
            ),
          );
        });
      });
    });

    it('_comment (if present) asserts public domain and references Andrewes Press 2002 as verification only', () => {
      // Copyright guardrail: presence is required for all 9 tones in this library.
      expect(typeof data._comment).toBe('string');
      expect(data._comment!).toContain('public domain');
      expect(data._comment!).toContain('Andrewes Press 2002');
    });
  });

  describe('Tonus Peregrinus specifics', () => {
    const peregrinus = toneCases.find((c) => c.file === 'tone-peregrinus.json')!;

    it('is loaded', () => {
      expect(peregrinus).toBeDefined();
    });

    it('has at least one variant with secondRecitingTone set (note + octave)', () => {
      const withSecond = peregrinus.data.variants.filter(
        (v: any) => v.secondRecitingTone !== undefined,
      );
      expect(withSecond.length).toBeGreaterThanOrEqual(1);
      withSecond.forEach((v: any) => {
        assertPitch(v.secondRecitingTone, 'peregrinus.secondRecitingTone');
      });
    });
  });
});
