/**
 * Chant metadata attached to a Psalm / Refrain / Text / ResponsivePrayer via `metadata.chant`.
 * Identifies which tone (and/or embedded GABC) should be used to sing this document.
 */
export interface ChantData {
  toneId?: string;
  tradition?: string;
  mode?: number | string;
  gabc?: string;
  source?: string;
}
