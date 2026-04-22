import { ToneVariant } from './tone-variant';

/**
 * Container for a base tone and all its variants.
 * Corresponds to one JSON data file per tone (e.g., tone-1.json).
 * Mode 'peregrinus' = Tonus Peregrinus; modes 1-8 = standard modes.
 */
export interface ToneFile {
  id: string;
  mode: number | 'peregrinus';
  name: string;
  variants: ToneVariant[];
  _comment?: string;
}
