import {
  ToneFile,
  ToneVariant,
  Differentia,
  NeumeGroup,
  Pitch,
  Mediation,
  ChantData,
  PsalmPointing,
  PsalmToneAssignment,
} from '../src';

describe('chant type shapes', () => {
  it('accepts a standard Tone I variant literal', () => {
    const recitingTone: Pitch = { note: 'A', octave: 4 };
    const mediation: Mediation = {
      cadence: [
        {
          role: 'accent',
          notes: [{ note: 'A', octave: 4 }],
        } as NeumeGroup,
      ],
    };
    const differentia: Differentia = {
      id: 'tone-1-a-4',
      label: 'IV',
      termination: {
        cadence: [
          { role: 'accent', notes: [{ note: 'G', octave: 4 }] },
          { role: 'post-accent', notes: [{ note: 'F', octave: 4 }] },
        ],
      },
    };
    const variant: ToneVariant = {
      id: 'tone-1-a',
      label: 'I.A',
      isDefault: true,
      intonation: [{ note: 'F', octave: 4 }, { note: 'A', octave: 4 }],
      recitingTone,
      mediation,
      differentiae: [differentia],
    };
    const file: ToneFile = {
      id: 'tone-1',
      mode: 1,
      name: 'Tone I',
      variants: [variant],
    };
    expect(file.variants[0].recitingTone.note).toBe('A');
    expect(file.variants[0].differentiae[0].id).toBe('tone-1-a-4');
  });

  it('accepts a Peregrinus variant with secondRecitingTone (two reciting notes)', () => {
    const variant: ToneVariant = {
      id: 'tone-peregrinus-a',
      label: 'P.A',
      isDefault: true,
      intonation: [{ note: 'G', octave: 3 }, { note: 'A', octave: 3 }],
      recitingTone: { note: 'A', octave: 3 },
      secondRecitingTone: { note: 'G', octave: 3 },
      mediation: { cadence: [] },
      differentiae: [
        {
          id: 'tone-peregrinus-a-1',
          label: '1',
          termination: { cadence: [] },
        },
      ],
    };
    expect(variant.recitingTone.note).toBe('A');
    expect(variant.secondRecitingTone).toBeDefined();
    expect(variant.secondRecitingTone!.note).toBe('G');
  });

  it('accepts abrupt mediationVariant flag', () => {
    const variant: ToneVariant = {
      id: 'tone-1-b',
      label: 'I.B',
      isDefault: false,
      intonation: [],
      recitingTone: { note: 'A', octave: 4 },
      mediation: { cadence: [] },
      mediationVariant: 'abrupt',
      differentiae: [],
    };
    expect(variant.mediationVariant).toBe('abrupt');
  });

  it('accepts optional intonations bundle and recordings', () => {
    const variant: ToneVariant = {
      id: 'tone-1-a',
      label: 'I.A',
      isDefault: true,
      intonation: [{ note: 'F', octave: 4 }],
      recitingTone: { note: 'A', octave: 4 },
      mediation: { cadence: [] },
      differentiae: [],
      intonations: {
        standard: [{ note: 'F', octave: 4 }, { note: 'A', octave: 4 }],
        solemn: [{ note: 'F', octave: 4 }, { note: 'G', octave: 4 }, { note: 'A', octave: 4 }],
        gospelCanticle: [{ note: 'F', octave: 4 }, { note: 'A', octave: 4 }],
      },
      useFor: ['psalm', 'canticle'],
      recordings: [
        { url: 'https://example.org/tone-1-a.mp3', credit: 'PD', license: 'CC0' },
      ],
    };
    expect(variant.intonations!.solemn!.length).toBe(3);
    expect(variant.recordings![0].credit).toBe('PD');
    expect(variant.useFor).toContain('psalm');
  });

  it('accepts a full VersePointing with extended fields', () => {
    const pointing: PsalmPointing = {
      verses: {
        '1': {
          intonationWords: 2,
          mediantAccent: 2,
          finalAccent: 1,
          caesura: 3,
          preparatorySyllables: [1, 3],
          ending: 'dactylic',
        },
        '4': {
          mediantAccent: 1,
          finalAccent: 2,
          flex: { wordFromEnd: 1, inflected: true },
        },
      },
    };
    expect(pointing.verses['1'].ending).toBe('dactylic');
    expect(pointing.verses['4'].flex!.inflected).toBe(true);
  });

  it('accepts ChantData and PsalmToneAssignment literals', () => {
    const chant: ChantData = {
      toneId: 'tone-8-a-1',
      tradition: 'sarum',
      mode: 8,
      source: 'sarum-antiphonale',
    };
    const assignment: PsalmToneAssignment = {
      source: 'bcp1979',
      psalm: '23',
      toneId: 'tone-8-a-1',
      season: 'ordinary',
      evening: false,
    };
    expect(chant.tradition).toBe('sarum');
    expect(assignment.toneId).toBe('tone-8-a-1');
  });

  it('accepts Tonus Peregrinus mode string on ToneFile', () => {
    const file: ToneFile = {
      id: 'tone-peregrinus',
      mode: 'peregrinus',
      name: 'Tonus Peregrinus',
      variants: [],
    };
    expect(file.mode).toBe('peregrinus');
  });
});
