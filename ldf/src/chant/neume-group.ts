import { Pitch } from './pitch';

/**
 * One or more pitches sung on a single syllable.
 * The role describes this neume group's function within a formula cadence.
 */
export interface NeumeGroup {
  notes: Pitch[];
  role: 'intonation' | 'reciting' | 'preparation' | 'accent' | 'post-accent';
}
