/**
 * Render a kebab-case tone id (e.g. `tone-1-a-4`) as a human-readable label
 * (e.g. `I.A.4`). Supports:
 *
 * - Standard tones `tone-<mode>-<variant>[-<differentia>]` — mode becomes a
 *   Roman numeral, variant is uppercased, differentia is appended verbatim.
 * - Peregrinus: `tone-peregrinus-<variant>` → `P.<VARIANT>`.
 * - `default` variants: omitted from the output (`tone-2-default-1` → `II.1`).
 * - `abrupt` trailing segment: rendered as a parenthetical suffix
 *   (`tone-1-b-abrupt` → `I.B (abrupt)`).
 */
const ROMAN: { [k: string]: string } = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
};

export function formatToneId(id: string): string {
  if (!id.startsWith('tone-')) {
    return id;
  }

  const parts = id.slice('tone-'.length).split('-');
  if (parts.length === 0) {
    return id;
  }

  // Peregrinus: tone-peregrinus-<variant> → P.<VARIANT>
  if (parts[0] === 'peregrinus') {
    const rest = parts.slice(1).map((p) => p.toUpperCase());
    return ['P', ...rest].join('.');
  }

  const modeNum = parts[0];
  const mode = ROMAN[modeNum] ?? modeNum.toUpperCase();

  const remaining = parts.slice(1);

  // Detect trailing 'abrupt' marker
  let abrupt = false;
  let tail = remaining;
  if (tail.length > 0 && tail[tail.length - 1] === 'abrupt') {
    abrupt = true;
    tail = tail.slice(0, -1);
  }

  // Drop 'default' variant marker (positionally the first of the remaining).
  if (tail.length > 0 && tail[0] === 'default') {
    tail = tail.slice(1);
  }

  const segments = [mode, ...tail.map((p) => p.toUpperCase())];
  const base = segments.join('.');

  return abrupt ? `${base} (abrupt)` : base;
}
