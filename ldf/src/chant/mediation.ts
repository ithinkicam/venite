import { NeumeGroup } from './neume-group';

/**
 * The cadence at the midpoint of a psalm verse (half-verse break).
 * Cadence neume groups are ordered from first sung to last sung.
 */
export interface Mediation {
  cadence: NeumeGroup[];
}
