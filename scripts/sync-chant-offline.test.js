#!/usr/bin/env node
/**
 * sync-chant-offline.test.js — W1.8
 *
 * Uses the Node built-in `node:test` runner (no Jest dependency).
 * Run with:  node scripts/sync-chant-offline.test.js
 * Or from scripts/:  npm test
 *
 * The tests use a fresh temp directory as `repoRoot`, write fixtures into
 * <repoRoot>/commonprayer/src/chant/{tones,pointing}/, invoke syncChantOffline,
 * and assert on the files it writes under <repoRoot>/app/src/offline/chant/.
 * The real repo's offline directory is never touched.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { syncChantOffline } from './sync-chant-offline.js';

/** Build a minimal valid ToneFile-shaped object. */
function toneFixture(id, mode, name) {
  return {
    id,
    mode,
    name,
    variants: [
      {
        id: `${id}-a`,
        label: 'A',
        isDefault: true,
        mediationVariant: 'standard',
        intonation: [{ note: 'F', octave: 3 }],
        recitingTone: { note: 'A', octave: 3 },
        mediation: {
          cadence: [{ notes: [{ note: 'A', octave: 3 }], role: 'accent' }],
        },
        differentiae: [
          {
            id: '1',
            label: '1',
            termination: {
              cadence: [
                { notes: [{ note: 'G', octave: 3 }], role: 'preparation' },
                { notes: [{ note: 'F', octave: 3 }], role: 'accent' },
              ],
            },
          },
        ],
      },
    ],
  };
}

async function makeSandbox() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'venite-scripts-'));
  const tonesDir = path.join(root, 'commonprayer', 'src', 'chant', 'tones');
  const outDir = path.join(root, 'app', 'src', 'offline', 'chant');
  await fs.mkdir(tonesDir, { recursive: true });
  return { root, tonesDir, outDir };
}

async function writeToneFile(dir, tone) {
  const file = path.join(dir, `${tone.id}.json`);
  await fs.writeFile(file, JSON.stringify(tone, null, 2), 'utf8');
  return file;
}

// A silent logger so test output isn't noisy with script log lines.
const silent = () => {};

test('aggregates every tone file into a single tones.json with stable ordering', async () => {
  const { root, tonesDir, outDir } = await makeSandbox();
  try {
    // Write in scrambled order to confirm the script sorts them.
    await writeToneFile(tonesDir, toneFixture('tone-peregrinus', 'peregrinus', 'Tonus Peregrinus'));
    await writeToneFile(tonesDir, toneFixture('tone-3', 3, 'Tone III'));
    await writeToneFile(tonesDir, toneFixture('tone-1', 1, 'Tone I'));
    await writeToneFile(tonesDir, toneFixture('tone-2', 2, 'Tone II'));

    const result = await syncChantOffline({ repoRoot: root, outDir, log: silent });

    assert.equal(result.toneCount, 4);
    assert.equal(result.pointingFiles.length, 0);

    const written = JSON.parse(
      await fs.readFile(path.join(outDir, 'tones.json'), 'utf8')
    );
    assert.ok(Array.isArray(written.tones), 'tones must be an array');
    assert.deepEqual(
      written.tones.map((t) => t.id),
      ['tone-1', 'tone-2', 'tone-3', 'tone-peregrinus'],
      'tones sort in canonical order (numeric ascending, peregrinus last)'
    );
    // Spot-check the payload is complete.
    assert.equal(written.tones[0].name, 'Tone I');
    assert.equal(written.tones[0].variants.length, 1);
    assert.equal(written.tones[3].mode, 'peregrinus');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('fails with a clear error naming the bad file when a required field is missing', async () => {
  const { root, tonesDir, outDir } = await makeSandbox();
  try {
    const broken = toneFixture('tone-1', 1, 'Tone I');
    delete broken.variants; // required field
    await writeToneFile(tonesDir, broken);

    await assert.rejects(
      () => syncChantOffline({ repoRoot: root, outDir, log: silent }),
      (err) => {
        assert.match(err.message, /tone-1\.json/);
        assert.match(err.message, /variants/);
        return true;
      }
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('skips pointing gracefully when the pointing directory does not yet exist', async () => {
  const { root, tonesDir, outDir } = await makeSandbox();
  try {
    await writeToneFile(tonesDir, toneFixture('tone-1', 1, 'Tone I'));
    const logs = [];
    const result = await syncChantOffline({
      repoRoot: root,
      outDir,
      log: (m) => logs.push(m),
    });

    assert.equal(result.pointingFiles.length, 0);
    assert.ok(
      logs.some((m) => m.includes('no pointing data yet')),
      'logs the "no pointing data yet" line when pointing/ is absent'
    );
    // Tones.json still written.
    const tonesJson = JSON.parse(
      await fs.readFile(path.join(outDir, 'tones.json'), 'utf8')
    );
    assert.equal(tonesJson.tones.length, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('copies pointing fixtures preserving basenames when pointing/ exists', async () => {
  const { root, tonesDir, outDir } = await makeSandbox();
  const pointingDir = path.join(root, 'commonprayer', 'src', 'chant', 'pointing');
  await fs.mkdir(pointingDir, { recursive: true });
  try {
    await writeToneFile(tonesDir, toneFixture('tone-1', 1, 'Tone I'));
    const ps23 = { psalm: 23, verses: [{ number: 1, text: 'example' }] };
    const ps95 = { psalm: 95, verses: [{ number: 1, text: 'example' }] };
    await fs.writeFile(
      path.join(pointingDir, 'psalm-23.json'),
      JSON.stringify(ps23, null, 2),
      'utf8'
    );
    await fs.writeFile(
      path.join(pointingDir, 'psalm-95.json'),
      JSON.stringify(ps95, null, 2),
      'utf8'
    );

    const result = await syncChantOffline({ repoRoot: root, outDir, log: silent });
    assert.equal(result.pointingFiles.length, 2);

    const writtenPs23 = JSON.parse(
      await fs.readFile(path.join(outDir, 'pointing', 'psalm-23.json'), 'utf8')
    );
    assert.deepEqual(writtenPs23, ps23);
    const writtenPs95 = JSON.parse(
      await fs.readFile(path.join(outDir, 'pointing', 'psalm-95.json'), 'utf8')
    );
    assert.deepEqual(writtenPs95, ps95);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
