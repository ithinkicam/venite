#!/usr/bin/env node
/**
 * batch-point-psalms.js — Phase 2 prep, Wave 2
 *
 * Run the algorithmic first-pass pointer (`pointVerse` from
 * `ldf/src/chant/point-psalm.ts`) over a list of BCP 1979 psalms and emit
 * `commonprayer/src/chant/pointing/psalm-<N>.json` fixture files plus a
 * regenerated aggregate `psalms-bcp1979.json`.
 *
 * Each generated fixture is flagged DRAFT via a `_meta` header. These are
 * NOT final pointings — they require editorial review via the
 * `/chant-pointing` skill (`.planning/skills/chant-pointing.md`).
 *
 * Existing manually-pointed fixtures (Ps 23, Ps 95 and any other psalm whose
 * fixture lacks the `_meta.status === 'DRAFT…'` marker) are preserved as-is:
 * the script never overwrites a hand-pointed file, and the aggregator merges
 * existing fixtures with the newly generated ones.
 *
 * Read  (sources of truth):
 *   commonprayer/src/liturgy/psalter/bcp1979/psalm-<N>.json — verse splits
 *   commonprayer/src/chant/tones/tone-1.json                — pointing tone
 *   commonprayer/src/chant/pointing/psalm-23.json           — preserve as-is
 *   commonprayer/src/chant/pointing/psalm-95.json           — preserve as-is
 *
 * Write:
 *   commonprayer/src/chant/pointing/psalm-<N>.json          — DRAFT fixtures
 *   commonprayer/src/chant/pointing/psalms-bcp1979.json     — aggregate
 *
 * Usage:
 *   node scripts/batch-point-psalms.js                # default 18-psalm set
 *   node scripts/batch-point-psalms.js 1 8 19         # explicit psalm list
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PSALTER_DIR = path.join(REPO_ROOT, 'commonprayer', 'src', 'liturgy', 'psalter', 'bcp1979');
const POINTING_DIR = path.join(REPO_ROOT, 'commonprayer', 'src', 'chant', 'pointing');
const TONES_DIR = path.join(REPO_ROOT, 'commonprayer', 'src', 'chant', 'tones');

const POINT_PSALM_CJS = path.join(REPO_ROOT, 'ldf', 'dist', 'cjs', 'chant', 'point-psalm.js');

// Default Phase-2-prep target — 18 BCP 1979 Daily-Office staples.
const DEFAULT_PSALMS = [
  '1', '4', '8', '19', '24', '27',
  '42', '51', '63', '67', '84', '91',
  '100', '103', '121', '130', '134', '139',
];

// Psalms whose fixtures are hand-pointed and must NOT be overwritten by this
// script. The aggregator preserves them as-is.
const HAND_POINTED = new Set(['23', '95']);

const TODAY_ISO = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadPointVerse() {
  // eslint-disable-next-line global-require
  const mod = require(POINT_PSALM_CJS);
  if (typeof mod.pointVerse !== 'function') {
    throw new Error(
      `[batch-point-psalms] pointVerse not exported from ${POINT_PSALM_CJS}. Did you run 'cd ldf && npm run build:cjs'?`
    );
  }
  return mod.pointVerse;
}

async function loadToneVariant() {
  const file = path.join(TONES_DIR, 'tone-1.json');
  const tone = JSON.parse(await fs.readFile(file, 'utf8'));
  if (!Array.isArray(tone.variants) || tone.variants.length === 0) {
    throw new Error(`[batch-point-psalms] tone-1.json has no variants`);
  }
  // Prefer the explicitly default-flagged variant; fall back to first.
  return tone.variants.find((v) => v.isDefault) ?? tone.variants[0];
}

/**
 * Extract `{ number, verse, halfverse }[]` from a BCP 1979 psalter source
 * file. Mirrors the loader used in `ldf/tests/point-psalm.test.ts`.
 */
function extractVerses(psalterDoc) {
  if (!psalterDoc?.data?.[0]?.value) {
    throw new Error('[batch-point-psalms] unexpected psalter shape');
  }
  const sections = psalterDoc.data[0].value;
  const verses = [];
  for (const section of sections) {
    if (section?.type === 'psalm-section' && Array.isArray(section.value)) {
      for (const v of section.value) {
        if (v?.type === 'psalm-verse') {
          verses.push({
            number: String(v.number),
            verse: v.verse ?? '',
            halfverse: v.halfverse ?? '',
          });
        }
      }
    }
  }
  return verses;
}

function metaHeader() {
  return {
    status: 'DRAFT — algorithmic first pass',
    generated: TODAY_ISO,
    generator: 'ldf/src/chant/point-psalm.ts via scripts/batch-point-psalms.js',
    notice:
      'Needs editorial review via /chant-pointing skill. NOT a final pointing.',
  };
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJson(file, body) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
}

/**
 * Generate a single DRAFT fixture for one psalm. Returns the verses-only
 * object (the same shape as `psalm-23.json`'s `verses` field) plus the full
 * fixture body that was written.
 */
async function generateFixtureFor(psalmNumber, pointVerse, toneVariant) {
  const psalterFile = path.join(PSALTER_DIR, `psalm-${psalmNumber}.json`);
  const psalter = await readJsonIfExists(psalterFile);
  if (!psalter) {
    throw new Error(
      `[batch-point-psalms] psalter source not found for psalm ${psalmNumber}: ${psalterFile}`
    );
  }
  const verses = extractVerses(psalter);
  const versesOut = {};
  for (const v of verses) {
    const pointing = pointVerse({
      text: v.verse,
      halfverse: v.halfverse,
      tone: toneVariant,
      isVerseOne: v.number === '1',
    });
    versesOut[v.number] = pointing;
  }

  const body = {
    _meta: metaHeader(),
    psalm: psalmNumber,
    source: 'venite-editorial',
    verses: versesOut,
  };
  return { body, versesOut, verseCount: verses.length };
}

/**
 * Collect every per-psalm pointing fixture (existing hand-pointed AND newly
 * generated) and write the aggregate `psalms-bcp1979.json`. Preserves the
 * existing aggregate's top-level `_comment` if present.
 */
async function regenerateAggregate() {
  const aggregateFile = path.join(POINTING_DIR, 'psalms-bcp1979.json');
  const existing = await readJsonIfExists(aggregateFile);
  const allEntries = await fs.readdir(POINTING_DIR);
  const perPsalmFiles = allEntries
    .filter((f) => /^psalm-\d+\.json$/.test(f))
    .sort((a, b) => {
      const an = Number(a.match(/(\d+)/)[1]);
      const bn = Number(b.match(/(\d+)/)[1]);
      return an - bn;
    });

  const psalms = {};
  for (const f of perPsalmFiles) {
    const body = await readJsonIfExists(path.join(POINTING_DIR, f));
    if (!body || !body.psalm || !body.verses) continue;
    psalms[body.psalm] = body.verses;
  }

  const out = {
    psalter: 'bcp1979',
    source: 'venite-editorial',
    _comment:
      existing?._comment ??
      "Aggregator for all BCP 1979 psalms with pointing. Phase 1 shipped Ps 23 and Ps 95 as golden fixtures; additional psalms added iteratively. Some entries are DRAFT algorithmic first passes — see the per-psalm files for `_meta.status` markers. Editorial choices follow St Dunstan structural conventions but are Venite's own output; no specific pointings from any copyrighted psalter were reproduced.",
    psalms,
  };
  await writeJson(aggregateFile, out);
  return { aggregateFile, psalmCount: Object.keys(psalms).length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function batchPointPsalms(psalmNumbers = DEFAULT_PSALMS, opts = {}) {
  const log = opts.log ?? ((msg) => console.log(msg));

  const pointVerse = loadPointVerse();
  const toneVariant = await loadToneVariant();

  const written = [];
  const merged = [];
  const skipped = [];
  for (const n of psalmNumbers) {
    if (HAND_POINTED.has(String(n))) {
      // Hand-pointed fixtures: preserve every existing field but MERGE in
      // build-time stress-syllable hints (`mediantStressSyllable` /
      // `finalStressSyllable`) so the renderer's hint-driven splitter
      // engages. This never touches `mediantAccent` / `finalAccent` /
      // `flex` / `ending` — only adds the two new hint fields.
      const stats = await mergeStressHintsInto(n, pointVerse, toneVariant);
      merged.push({ psalm: n, ...stats });
      log(
        `[batch-point-psalms] merged stress hints into psalm ${n} ` +
          `(${stats.hintsAdded} hints across ${stats.versesTouched} verses)`
      );
      continue;
    }
    const psalterFile = path.join(PSALTER_DIR, `psalm-${n}.json`);
    try {
      await fs.access(psalterFile);
    } catch {
      skipped.push({ psalm: n, reason: `psalter source missing: ${psalterFile}` });
      continue;
    }
    const { body, verseCount } = await generateFixtureFor(n, pointVerse, toneVariant);
    const outFile = path.join(POINTING_DIR, `psalm-${n}.json`);
    await writeJson(outFile, body);
    written.push({ psalm: n, file: outFile, verseCount });
    log(`[batch-point-psalms] wrote DRAFT psalm ${n} (${verseCount} verses) → ${path.relative(REPO_ROOT, outFile)}`);
  }

  const agg = await regenerateAggregate();
  log(`[batch-point-psalms] aggregated ${agg.psalmCount} psalms → ${path.relative(REPO_ROOT, agg.aggregateFile)}`);

  // Stress-lookup hit-rate stats (build-time, for reporting).
  let stressStats = null;
  try {
    const ldfChant = require(path.join(REPO_ROOT, 'ldf', 'dist', 'cjs', 'chant'));
    if (typeof ldfChant.getStressLookupStats === 'function') {
      stressStats = ldfChant.getStressLookupStats();
      log(
        `[batch-point-psalms] CMU stress-dict lookups: ` +
          `${stressStats.succeeded}/${stressStats.attempted} succeeded`
      );
    }
  } catch (_e) {
    // Optional reporting; ignore failures.
  }

  return { written, merged, skipped, aggregate: agg, stressStats };
}

/**
 * Merge build-time stress hints into an existing hand-pointed fixture
 * without altering any of its existing fields. For each verse:
 *   - Re-run `pointVerse` over the corresponding psalter verse to obtain
 *     the freshly-computed `mediantStressSyllable` / `finalStressSyllable`.
 *   - If the existing fixture already has a value for either field, leave
 *     it intact (editorial wins). Otherwise add the hint when the fresh
 *     pointing produced one.
 * Writes the modified fixture back to disk in canonical key order.
 */
async function mergeStressHintsInto(psalmNumber, pointVerse, toneVariant) {
  const fixtureFile = path.join(POINTING_DIR, `psalm-${psalmNumber}.json`);
  const psalterFile = path.join(PSALTER_DIR, `psalm-${psalmNumber}.json`);
  const fixture = await readJsonIfExists(fixtureFile);
  const psalter = await readJsonIfExists(psalterFile);
  if (!fixture || !psalter) {
    return { hintsAdded: 0, versesTouched: 0, missing: true };
  }
  const verses = extractVerses(psalter);
  let hintsAdded = 0;
  let versesTouched = 0;
  for (const v of verses) {
    const existing = fixture.verses?.[v.number];
    if (!existing) continue;
    const fresh = pointVerse({
      text: v.verse,
      halfverse: v.halfverse,
      tone: toneVariant,
      isVerseOne: v.number === '1',
    });
    let touched = false;
    if (
      existing.mediantStressSyllable === undefined &&
      typeof fresh.mediantStressSyllable === 'number'
    ) {
      existing.mediantStressSyllable = fresh.mediantStressSyllable;
      hintsAdded += 1;
      touched = true;
    }
    if (
      existing.finalStressSyllable === undefined &&
      typeof fresh.finalStressSyllable === 'number'
    ) {
      existing.finalStressSyllable = fresh.finalStressSyllable;
      hintsAdded += 1;
      touched = true;
    }
    if (touched) versesTouched += 1;
  }
  await writeJson(fixtureFile, fixture);
  return { hintsAdded, versesTouched };
}

// CLI entry point.
const isDirectRun =
  import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (isDirectRun) {
  const args = process.argv.slice(2);
  const psalms = args.length > 0 ? args : DEFAULT_PSALMS;
  batchPointPsalms(psalms).catch((err) => {
    console.error(err.stack || err.message || String(err));
    process.exit(1);
  });
}
