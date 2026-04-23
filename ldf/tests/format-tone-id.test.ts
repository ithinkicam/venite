import { formatToneId } from '../src';

describe('formatToneId', () => {
  const cases: [string, string][] = [
    ['tone-1-a-4', 'I.A.4'],
    ['tone-2-default-1', 'II.1'],
    ['tone-peregrinus-a', 'P.A'],
    ['tone-1-b-abrupt', 'I.B (abrupt)'],
    ['tone-3-s-6', 'III.S.6'],
  ];

  it.each(cases)('formats %s as %s', (slug, human) => {
    expect(formatToneId(slug)).toBe(human);
  });
});
