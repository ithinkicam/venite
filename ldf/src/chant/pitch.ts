/**
 * A single pitched note in scientific pitch notation.
 * Only Bb occurs as an accidental in the Gregorian/Sarum chant context.
 */
export interface Pitch {
  note: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  octave: number;
  accidental?: 'b';
}
