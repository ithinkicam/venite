import { resolvePsalmTone } from '../src/chant/resolve-psalm-tone';
import type { ToneFile } from '../src/chant/tone-file';
import type { PsalmToneAssignmentTable } from '../src/chant/resolve-psalm-tone';

// Minimal ToneFile fixtures. Notes are immaterial to the resolver — it only
// touches `id`, `variants[i]`, and `variants[i].differentiae[j]`. We give
// each differentia a distinguishing `id` so test assertions can target the
// exact one that should be returned.
function makeTone(id: string, differentiaIds: string[]): ToneFile {
  return {
    id,
    mode: id === 'tone-peregrinus' ? 'peregrinus' : Number(id.split('-')[1]) || 1,
    name: id,
    variants: [
      {
        id: `${id}-a`,
        label: 'A',
        isDefault: true,
        intonation: [],
        recitingTone: { note: 'A', octave: 3 },
        mediation: { cadence: [] },
        differentiae: differentiaIds.map((did) => ({
          id: did,
          label: did,
          termination: { cadence: [] },
        })),
      },
    ],
  };
}

const TONES: ToneFile[] = [
  makeTone('tone-1', ['1', '2', '3']),
  makeTone('tone-5', ['1', '2']),
  makeTone('tone-peregrinus', ['1']),
];

const TABLE: PsalmToneAssignmentTable = {
  assignments: {
    '95': { toneId: 'tone-5', variantIndex: 0, differentiaIndex: 0 },
    '114': { toneId: 'tone-peregrinus', variantIndex: 0, differentiaIndex: 0 },
    '115': { toneId: 'tone-peregrinus', variantIndex: 0, differentiaIndex: 0 },
  },
  default: { toneId: 'tone-1', variantIndex: 0, differentiaIndex: 0 },
};

describe('resolvePsalmTone', () => {
  it('returns Tone 5 for Ps 95 (invitatory)', () => {
    const r = resolvePsalmTone('95', TONES, TABLE);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-5');
    expect(r!.variant.id).toBe('tone-5-a');
    expect(r!.differentia.id).toBe('1');
  });

  it('returns Peregrinus for Ps 114', () => {
    const r = resolvePsalmTone(114, TONES, TABLE);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-peregrinus');
  });

  it('returns Tone 1 for Ps 23 (default)', () => {
    const r = resolvePsalmTone('23', TONES, TABLE);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-1');
    expect(r!.variant.id).toBe('tone-1-a');
  });

  it('returns Tone 1 for unknown psalm 999 (default)', () => {
    const r = resolvePsalmTone('999', TONES, TABLE);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-1');
  });

  it('returns null for empty tones array', () => {
    const r = resolvePsalmTone('23', [], TABLE);
    expect(r).toBeNull();
  });

  it('falls back to first available triple when table is null', () => {
    const r = resolvePsalmTone('23', TONES, null);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-1');
  });

  it('falls back to default when assignment toneId is unknown', () => {
    const tableWithBadAssignment: PsalmToneAssignmentTable = {
      assignments: {
        '23': { toneId: 'tone-does-not-exist', variantIndex: 0, differentiaIndex: 0 },
      },
      default: { toneId: 'tone-1', variantIndex: 0, differentiaIndex: 0 },
    };
    const r = resolvePsalmTone('23', TONES, tableWithBadAssignment);
    expect(r).not.toBeNull();
    expect(r!.toneId).toBe('tone-1');
  });
});
