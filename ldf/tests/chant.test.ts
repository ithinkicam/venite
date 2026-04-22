import { Psalm, DisplaySettings } from '../src';

describe('Psalm with chant metadata', () => {
  it('round-trips chant and pointing metadata', () => {
    const psalm = new Psalm({
      type: 'psalm',
      metadata: {
        chant: { toneId: 'tone-1-a-4' },
        pointing: {
          verses: {
            '1': { mediantAccent: 2, finalAccent: 1 },
          },
        },
      },
    });

    expect(psalm.metadata).toBeDefined();
    expect(psalm.metadata!.chant).toEqual({ toneId: 'tone-1-a-4' });
    expect(psalm.metadata!.pointing).toEqual({
      verses: { '1': { mediantAccent: 2, finalAccent: 1 } },
    });
    expect(psalm.metadata!.chant!.toneId).toBe('tone-1-a-4');
    expect(psalm.metadata!.pointing!.verses['1'].mediantAccent).toBe(2);
    expect(psalm.metadata!.pointing!.verses['1'].finalAccent).toBe(1);
  });

  it('preserves existing metadata fields alongside chant/pointing', () => {
    const psalm = new Psalm({
      type: 'psalm',
      metadata: {
        number: '23',
        localname: 'Psalm 23',
        chant: { toneId: 'tone-8-a-1', tradition: 'sarum' },
      },
    });
    expect(psalm.metadata!.number).toBe('23');
    expect(psalm.metadata!.localname).toBe('Psalm 23');
    expect(psalm.metadata!.chant!.tradition).toBe('sarum');
  });
});

describe('DisplaySettings default construction', () => {
  it('constructs with no args', () => {
    const ds = new DisplaySettings();
    expect(ds).toBeInstanceOf(DisplaySettings);
    expect(ds.dropcaps).toBe('plain');
  });
});
