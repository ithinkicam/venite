import type { ToneFile } from './tone-file';
import type { ToneVariant } from './tone-variant';
import type { Differentia } from './differentia';

/**
 * Runtime shape of `app/src/offline/chant/psalm-tone-assignments.json` after
 * the W4 sync step. Keys are psalm-number strings (e.g. `"95"`); each entry
 * names a `toneId` plus indices into that tone's `variants[]` and
 * `variants[i].differentiae[]`. The `default` entry is consulted when the
 * psalm number isn't in `assignments`.
 */
export interface PsalmToneAssignmentTable {
  assignments: Record<string, { toneId: string; variantIndex: number; differentiaIndex: number }>;
  default: { toneId: string; variantIndex: number; differentiaIndex: number };
}

/**
 * Outcome of `resolvePsalmTone`. Surfaces the resolved variant + differentia
 * (so callers can hand them straight to `<ldf-chant-notation>` /
 * `<ldf-chant-player>`) plus the resolved `toneId` for diagnostics.
 */
export interface ResolvedTone {
  variant: ToneVariant;
  differentia: Differentia;
  toneId: string;
}

/**
 * Look up the tone variant + differentia to use for a given psalm number.
 *
 * Resolution order:
 *   1. `table.assignments[<psalmNumber>]` — explicit per-psalm entry.
 *   2. `table.default`                    — fallback when the psalm is unlisted.
 *   3. First `(tone, variant, differentia)` triple available across `tones[]`,
 *      so an unfortunately-shaped table never blocks rendering.
 *
 * Returns `null` when `tones` is empty or no triple can be assembled.
 */
export function resolvePsalmTone(
  psalmNumber: string | number | undefined,
  tones: ToneFile[],
  table: PsalmToneAssignmentTable | null,
): ResolvedTone | null {
  if (!Array.isArray(tones) || tones.length === 0) return null;
  const key = psalmNumber != null ? String(psalmNumber) : null;

  const lookup = (a: { toneId: string; variantIndex: number; differentiaIndex: number }) => {
    const tone = tones.find((t) => t.id === a.toneId);
    if (!tone) return null;
    const variant = tone.variants?.[a.variantIndex] ?? tone.variants?.[0];
    if (!variant) return null;
    // Differentiae live on the variant in the canonical `ToneFile` shape; the
    // legacy top-level `differentiae` array is accepted as a fallback.
    const differentia =
      (variant as any).differentiae?.[a.differentiaIndex] ??
      (variant as any).differentiae?.[0] ??
      (tone as any).differentiae?.[0];
    if (!differentia) return null;
    return { variant, differentia, toneId: tone.id };
  };

  if (key && table?.assignments?.[key]) {
    const r = lookup(table.assignments[key]);
    if (r) return r;
  }
  if (table?.default) {
    const r = lookup(table.default);
    if (r) return r;
  }
  // Last-ditch fallback: first available combination across all tones.
  for (const tone of tones) {
    for (const variant of tone.variants || []) {
      const diff = (variant as any).differentiae?.[0] || (tone as any).differentiae?.[0];
      if (diff) return { variant, differentia: diff, toneId: tone.id };
    }
  }
  return null;
}
