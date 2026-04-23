import { Pitch } from './pitch';
import { Mediation } from './mediation';
import { Differentia } from './differentia';

/**
 * A complete usable psalm tone: a specific mediation variant with its differentiae.
 * Identified by the combination of base tone mode and mediation variant letter (e.g., "Tone I A").
 *
 * `secondRecitingTone` exists to support Tonus Peregrinus, which has a distinct
 * reciting note in the second half of the verse.
 *
 * `mediationVariant: 'abrupt'` marks mediations that lack the standard preparation
 * notes and cadence onto the accent directly — common in later medieval practice.
 */
export interface ToneVariant {
  id: string;
  label: string;
  isDefault: boolean;
  intonation: Pitch[];
  recitingTone: Pitch;
  secondRecitingTone?: Pitch;
  mediation: Mediation;
  mediationVariant?: 'standard' | 'abrupt';
  differentiae: Differentia[];
  intonations?: {
    standard: Pitch[];
    solemn?: Pitch[];
    gospelCanticle?: Pitch[];
  };
  useFor?: string[];
  recordings?: { url: string; credit: string; license?: string }[];
}
