import { NeumeGroup } from './neume-group';

/**
 * A specific ending pattern (differentia) for a tone variant.
 * The differentia is the termination formula that leads back into the antiphon.
 * Mediation and termination are fixed pairs — not independently combinable axes.
 */
export interface Differentia {
  id: string;
  label: string;
  termination: { cadence: NeumeGroup[] };
}
