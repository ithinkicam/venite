#!/usr/bin/env node
/**
 * sync-chant-offline.js — W1.8
 *
 * Aggregate chant tone JSON files (and, once available, pointing fixture JSONs)
 * from `commonprayer/src/chant/` into the Ionic app's offline assets directory
 * at `app/src/offline/chant/`.
 *
 * Read  (source of truth):
 *   commonprayer/src/chant/tones/*.json           — one file per tone
 *   commonprayer/src/chant/pointing/*.json        — one file per pointing fixture
 *                                                   (created in Wave 2; optional here)
 *   commonprayer/src/chant/psalm-tone-assignments.json — per-psalm tone assignment
 *                                                   table (Phase 2 W4; optional here)
 *
 * Write (runtime-fetched offline assets):
 *   app/src/offline/chant/tones.json              — { tones: ToneFile[] } ordered
 *                                                   tone-1 … tone-8, tone-peregrinus
 *   app/src/offline/chant/pointing/<basename>.json — one file per pointing fixture
 *   app/src/offline/chant/psalm-tone-assignments.json — copy of the assignment table
 *
 * Each tone JSON must match the `ToneFile` interface (see ldf/src/chant/tone-file.ts):
 *   { id: string, mode: number | 'peregrinus', name: string, variants: ToneVariant[] }
 *
 * Validation is best-effort: required top-level fields must be present. If any
 * tone file is missing a required field, the script fails with a clear error
 * naming the bad file.
 *
 * Run:   node scripts/sync-chant-offline.js
 * Or:    (cd scripts && npm run sync-chant)
 *
 * This module also exports `syncChantOffline({ repoRoot, outDir })` for tests.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default paths (relative to repo root). The repo root is the parent of `scripts/`.
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

const TONE_REQUIRED_FIELDS = ['id', 'mode', 'name', 'variants'];

// Canonical tone-id ordering for the aggregated tones.json. Tone-peregrinus
// always sorts last; numeric tones sort by mode number.
const TONE_ORDER = [
  'tone-1',
  'tone-2',
  'tone-3',
  'tone-4',
  'tone-5',
  'tone-6',
  'tone-7',
  'tone-8',
  'tone-peregrinus',
];

function toneSortKey(id) {
  const ix = TONE_ORDER.indexOf(id);
  // Unknown tone ids sort after all known ones but before each other alphabetically.
  return ix === -1 ? TONE_ORDER.length + 1 : ix;
}

/**
 * Validate that a parsed tone JSON has every required top-level field.
 * Throws a detailed Error if any are missing.
 *
 * @param {unknown} parsed     - Parsed JSON body.
 * @param {string}  sourceFile - Absolute or relative path to the source JSON file
 *                               (used in the error message only).
 */
function validateToneFile(parsed, sourceFile) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `[sync-chant-offline] ${sourceFile}: expected a JSON object, got ${
        Array.isArray(parsed) ? 'array' : typeof parsed
      }.`
    );
  }
  const missing = TONE_REQUIRED_FIELDS.filter(
    (field) => !Object.prototype.hasOwnProperty.call(parsed, field)
  );
  if (missing.length > 0) {
    throw new Error(
      `[sync-chant-offline] ${sourceFile}: missing required ToneFile field(s): ${missing.join(
        ', '
      )}. Required: ${TONE_REQUIRED_FIELDS.join(', ')}.`
    );
  }
  if (!Array.isArray(parsed.variants)) {
    throw new Error(
      `[sync-chant-offline] ${sourceFile}: 'variants' must be an array, got ${typeof parsed.variants}.`
    );
  }
  if (parsed.variants.length === 0) {
    throw new Error(
      `[sync-chant-offline] ${sourceFile}: 'variants' must not be empty.`
    );
  }
}

/**
 * Read and JSON-parse every *.json file in a directory. Returns an array of
 * `{ file, parsed }` objects (absolute path + parsed body), sorted by basename
 * so callers get a stable order.
 *
 * If the directory does not exist, returns null (caller decides whether to skip).
 *
 * @param {string} dir
 * @returns {Promise<null | Array<{ file: string, parsed: unknown }>>}
 */
async function readJsonDir(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
  const jsonEntries = entries.filter((e) => e.endsWith('.json')).sort();
  const files = [];
  for (const entry of jsonEntries) {
    const file = path.join(dir, entry);
    const raw = await fs.readFile(file, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `[sync-chant-offline] ${file}: invalid JSON — ${err.message}`
      );
    }
    files.push({ file, parsed });
  }
  return files;
}

async function writeJson(outFile, body) {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const payload = JSON.stringify(body, null, 2) + '\n';
  await fs.writeFile(outFile, payload, 'utf8');
  return Buffer.byteLength(payload, 'utf8');
}

/**
 * Main sync function. Aggregates tones and (optionally) pointing fixtures and
 * writes them into the offline-assets directory.
 *
 * @param {object} [opts]
 * @param {string} [opts.repoRoot] - Repo root to resolve source paths against.
 *                                    Defaults to the directory above this script.
 * @param {string} [opts.outDir]   - Output directory for the generated JSONs.
 *                                    Defaults to `<repoRoot>/app/src/offline/chant`.
 * @param {(msg: string) => void} [opts.log] - Optional logger (defaults to console.log).
 *
 * @returns {Promise<{
 *   tonesFile: string,
 *   toneCount: number,
 *   tonesBytes: number,
 *   pointingFiles: string[],
 *   pointingBytes: number,
 *   assignmentsFile: string | null,
 *   assignmentsBytes: number,
 * }>}
 */
export async function syncChantOffline(opts = {}) {
  const repoRoot = opts.repoRoot ?? DEFAULT_REPO_ROOT;
  const outDir = opts.outDir ?? path.join(repoRoot, 'app', 'src', 'offline', 'chant');
  const log = opts.log ?? ((msg) => console.log(msg));

  const tonesSrcDir = path.join(repoRoot, 'commonprayer', 'src', 'chant', 'tones');
  const pointingSrcDir = path.join(repoRoot, 'commonprayer', 'src', 'chant', 'pointing');
  const assignmentsSrcFile = path.join(
    repoRoot,
    'commonprayer',
    'src',
    'chant',
    'psalm-tone-assignments.json'
  );

  // --- Tones (required) ------------------------------------------------------
  const toneEntries = await readJsonDir(tonesSrcDir);
  if (toneEntries === null) {
    throw new Error(
      `[sync-chant-offline] tones source directory not found: ${tonesSrcDir}`
    );
  }
  if (toneEntries.length === 0) {
    throw new Error(
      `[sync-chant-offline] no tone JSON files found in ${tonesSrcDir}`
    );
  }

  for (const { file, parsed } of toneEntries) {
    validateToneFile(parsed, path.relative(repoRoot, file));
  }

  const tones = toneEntries
    .map(({ parsed }) => parsed)
    .sort((a, b) => {
      const diff = toneSortKey(a.id) - toneSortKey(b.id);
      return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
    });

  const tonesFile = path.join(outDir, 'tones.json');
  const tonesBytes = await writeJson(tonesFile, { tones });
  log(
    `[sync-chant-offline] wrote ${tones.length} tones → ${path.relative(
      repoRoot,
      tonesFile
    )} (${tonesBytes} bytes)`
  );

  // --- Pointing fixtures (optional — created in Wave 2) ---------------------
  const pointingEntries = await readJsonDir(pointingSrcDir);
  const pointingFiles = [];
  let pointingBytes = 0;
  if (pointingEntries === null) {
    log('[sync-chant-offline] no pointing data yet; skipping');
  } else if (pointingEntries.length === 0) {
    log('[sync-chant-offline] pointing directory empty; skipping');
  } else {
    const pointingOutDir = path.join(outDir, 'pointing');
    for (const { file, parsed } of pointingEntries) {
      const basename = path.basename(file);
      const outFile = path.join(pointingOutDir, basename);
      const bytes = await writeJson(outFile, parsed);
      pointingFiles.push(outFile);
      pointingBytes += bytes;
      log(
        `[sync-chant-offline] wrote pointing ${basename} → ${path.relative(
          repoRoot,
          outFile
        )} (${bytes} bytes)`
      );
    }
    log(
      `[sync-chant-offline] wrote ${pointingFiles.length} pointing file(s), total ${pointingBytes} bytes`
    );
  }

  // --- Psalm-tone assignments (optional — added in Phase 2 W4) --------------
  // Single-file copy. Fail-soft: if the source file isn't present we skip the
  // copy and emit a log line, mirroring the pointing-fixture behavior. The
  // runtime resolver in `<ldf-psalm>` falls back to its `default` entry when
  // the served JSON is missing or empty.
  let assignmentsFile = null;
  let assignmentsBytes = 0;
  try {
    const raw = await fs.readFile(assignmentsSrcFile, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `[sync-chant-offline] ${assignmentsSrcFile}: invalid JSON — ${err.message}`
      );
    }
    assignmentsFile = path.join(outDir, 'psalm-tone-assignments.json');
    assignmentsBytes = await writeJson(assignmentsFile, parsed);
    log(
      `[sync-chant-offline] wrote psalm-tone assignments → ${path.relative(
        repoRoot,
        assignmentsFile
      )} (${assignmentsBytes} bytes)`
    );
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      log('[sync-chant-offline] no psalm-tone assignments file; skipping');
    } else {
      throw err;
    }
  }

  return {
    tonesFile,
    toneCount: tones.length,
    tonesBytes,
    pointingFiles,
    pointingBytes,
    assignmentsFile,
    assignmentsBytes,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point. Only runs when the script is invoked directly, not when
// imported from a test.
// ---------------------------------------------------------------------------
const isDirectRun =
  import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isDirectRun) {
  syncChantOffline().catch((err) => {
    console.error(err.stack || err.message || String(err));
    process.exit(1);
  });
}
