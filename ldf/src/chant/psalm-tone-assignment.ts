/**
 * Assignment of a tone (by `toneId`) to a specific psalm in a specific context.
 * Used by the chant tone table to pick the right tone for a given psalm on a given day.
 */
export interface PsalmToneAssignment {
  source: string;
  psalm: string;
  toneId: string;
  season?: string;
  day?: string;
  weekday?: string;
  evening?: boolean;
  partNumber?: number;
}
