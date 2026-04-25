# Chant Phase 2 — Resume Prompt for Next Session

**Last touched:** 2026-04-25
**Branch state:** `ithinkicam/venite` master @ `6c60b279`. Working branch `claude/chant-phase-2-prep` is even with master + has the same final commit. 76 commits ahead of upstream `gbj/venite` master.

## What's shipped to master (since `5a09e1fc`)

### Phase 1
- LDF chant types (pitch, neume-group, mediation, differentia, tone-variant, tone-file, pointing, …)
- 9 Sarum tones + Peregrinus in `commonprayer/src/chant/tones/`
- Hand-pointed golden fixtures: Ps 23, Ps 95
- `<ldf-chant-pointing>` Stencil component (CSS overlay; bolded accent syllable)
- `DisplaySettings` fields: `chantNotation`, `chantTradition`, `psalmsBold`
- Settings-modal pickers; shared `DisplaySettingsModule` so /pray and /psalter use the same modal
- DisplaySettings wire-through on /pray, /psalter, /daily-readings
- Render-time pointing-table fetch from `/offline/chant/pointing/psalms-bcp1979.json`
- Default psalm on /psalter changed to 23 (golden fixture)
- 3 UAT-session bug fixes: shared DisplaySettingsModule, DisplaySettings positional-args alignment, default-psalm change

### Phase 2 Prep
- Pin `bbloomf/exsurge@23e6cccf4bd3c211a1ec6202cd36e95585f14c58` (v1.21.1)
- Install `tone@14.9.17`
- 18 algorithmic-first-pass DRAFT pointing fixtures (1, 4, 8, 19, 24, 27, 42, 51, 63, 67, 84, 91, 100, 103, 121, 130, 134, 139) → 20 total
- `VersePointing.{mediantStressSyllable, finalStressSyllable}` schema fields
- CMU Pronouncing Dictionary at build-time (96% hit rate) for stress lookup
- Three-tier syllable selection in `<ldf-chant-pointing>`: hint → English-suffix rule → last-vowel-cluster fallback

### Phase 2 W1 — first-light notation
- `<ldf-chant-notation>` Stencil component wrapping Exsurge
- ExsurgeChar.otf + Exsurge UMD shipped via `app/angular.json` assets
- Document-global `@font-face` in `app/src/index.html`; `document.fonts.load()` before measurement
- Exsurge loaded as global `<script>` (script-tag pattern; bare specifier doesn't resolve in browser/Stencil)
- Exsurge API correction: `performLayout(ctxt, force)` is sync (force = boolean), `layoutChantLines(ctxt, width, cb)` is async, `createSvgNode(ctxt)` is the renderer (not `createDrawable` — README is stale)
- Renders in `<ldf-psalm>` per verse when `chantNotation === 'always'`

### Phase 2 W2 — cadence aligned to stress
- `assignHalf` in `generate-gabc.ts` rewrite: places `accent`-role NeumeGroup on the stressed syllable instead of last-N-syllables
- `AssignHalfOptions` extended with `accentWordFromEnd` + `accentStressSyllable`
- Preparation groups walk back, post-accent groups walk forward
- Trailing syllables stay on reciting tone
- Falls back to legacy "last N" when no accent-role group present

### Phase 2 W3 — audio playback
- `generatePitchSequence(input)` companion to `generateGabc` (shared `assignBothHalves`)
- `<ldf-chant-player>` Stencil component, single Chant/Stop button, Tone.Synth + sine oscillator
- Tone.js v14.9.17 UMD shipped via angular.json + `<script>` tag in index.html
- Polls `window.Tone`, calls `Tone.start()` inside the click handler (browser autoplay policy)
- ~0.45s per syllable, 0.5s caesura pause

### Phase 2 W4 — per-psalm tone resolver
- `commonprayer/src/chant/psalm-tone-assignments.json` (Ps 95→Tone 5, Ps 114/115→Peregrinus, default→Tone 1)
- `ldf/src/chant/resolve-psalm-tone.ts` with three-tier fallback
- `<ldf-psalm>` `loadToneTable()` fetches tones + assignments once; resolves per psalm

## Verified UAT artifacts (in repo root)

- `UAT-stress-aware-ps23.png` — hand-pointed Ps 23 with stress-aware bolding
- `UAT-stress-aware-ps51.png` — DRAFT Ps 51, syllable-level accents now correct
- `UAT-chant-notation-ps23-tone1.png` — first-light notation rendering (W1)
- `UAT-w2-cadence-alignment-ps23.png` — same psalm post-cadence-fix (W2)
- `UAT-w3-chant-player-button.png` — Chant button visible above the staff (W3)
- `UAT-w4-resolver-ps95-tone5.png` — Ps 95 with Tone 5 reciting C4 (W4)

## Known gaps — carry forward

From `.planning/PHASE-2-PREP-SUMMARY.md` plus session-discovered issues:

1. **Audio polish — voice timbre**: `<ldf-chant-player>` uses a sine wave. Vocal-ish timbre needs a SoundFont or formant filter. Tone.js has `Tone.Sampler` for sample-based playback.
2. **Audio polish — melismas**: multi-pitch syllables only sound the first pitch. Need to schedule each pitch as a sub-beat within the syllable's time slot.
3. **Audio polish — MediaSession**: no lock-screen controls / background playback integration. Phase 1 references `MediaSessionService`; check if it already exists for TTS.
4. **Audio polish — per-verse playback**: only whole-psalm play right now. Per-verse buttons + scrub UI would be nicer.
5. **DRAFT pointings unreviewed**: 18 of 20 pointings carry `_meta.status: "DRAFT — algorithmic first pass"`. The `/chant-pointing` skill workflow exists for editorial review.
6. **Word-selection clitic list**: `from`, `to`, archaic function words leak through. Expand `CLITIC_WORDS` in `point-psalm.ts` as DRAFTs are reviewed.
7. **Lexical ≠ liturgical stress edge cases** (e.g. "iniquities"): override via hand-edit on individual fixtures.
8. **`preparatorySyllables` unused**: schema field exists; no pointer logic populates it. Multi-accent mediations need it.
9. **Collapsed / tablet-only modes**: `chantNotation` picker has 4 options but only `off` and `always` are wired in `<ldf-psalm>`. `collapsed` (toggle chevron per verse) and `tablet-only` (media-query gated) are no-ops.
10. **Full Sarum tone library**: 9 tones is a smoke set. Full Sarum table has more variants (e.g., Tone 1 has multiple endings). Editorial expansion — not blocking.
11. **Exsurge vendoring**: `bbloomf/exsurge` is bus-factor-1. Pin is by SHA but the source could disappear. Vendor under `app/vendor/exsurge/` when it becomes load-bearing.
12. **`PsalmToneAssignment.source` user-pref cascade**: schema-only; no runtime resolver yet. Phase 4 work per the original plan.
13. **Stencil e2e for chant-notation/chant-player**: written but `jest@24.9.0` vs `@stencil/core@2.17.4` requires `jest@27`. Pre-existing repo issue. Specs compile, don't execute.
14. **3 of the original 5 ldf baseline test failures** still fail (psalm.test, option.test, bible.test, find-collect.test) — pre-existing, unrelated.

## How to resume work

### 1. Restart ng serve (it dies between sessions)

```bash
cd /Users/cameronlewis/Dev/venite/app
NODE_OPTIONS=--openssl-legacy-provider npm run start
# Wait ~30-90s for "Compiled successfully"
```

If you switched branches, recopy local packages into `app/node_modules` first:
```bash
cd /Users/cameronlewis/Dev/venite
cp -R ldf/dist/. app/node_modules/@venite/ldf/dist/
cp -R components/dist/. app/node_modules/@venite/components/dist/
cp -R components/loader/. app/node_modules/@venite/components/loader/
```

The local-only `app/tsconfig.json` (`skipLibCheck: true`) and the `app/node_modules/@utils/keyboard/keyboard-controller.js` + `app/node_modules/cmu-pronouncing-dictionary/` stubs may need to be recreated if `npm install` purged them:
```bash
mkdir -p app/node_modules/@utils/keyboard && echo "module.exports = {};" > app/node_modules/@utils/keyboard/keyboard-controller.js
mkdir -p app/node_modules/cmu-pronouncing-dictionary && echo "module.exports = {};" > app/node_modules/cmu-pronouncing-dictionary/index.js && echo '{"name":"cmu-pronouncing-dictionary","version":"0.0.0-stub","main":"index.js"}' > app/node_modules/cmu-pronouncing-dictionary/package.json
```

If `app/node_modules/exsurge/` is missing (npm-clean state), reinstall:
```bash
cd app && NODE_OPTIONS=--openssl-legacy-provider npm install --legacy-peer-deps --no-audit --no-fund
```

### 2. Pick the next item

In rough payoff-per-effort order:

- **Audio polish — better voice** (medium) — replace `Tone.Synth` with `Tone.Sampler` and a vocal SoundFont, OR layer a formant filter. Big subjective improvement.
- **Audio polish — melismas** (small) — schedule each pitch in a multi-pitch syllable as a sub-beat in `<ldf-chant-player>`.
- **Collapsed / tablet-only modes** (small) — UI polish, completes the chantNotation picker story.
- **DRAFT editorial review pass** (medium, requires user judgment) — use `/chant-pointing` skill for psalms 1, 4, 8, 19, 24, 27, 42, 51, 63, 67, 84, 91, 100, 103, 121, 130, 134, 139. Surfaces real word-selection bugs in the algorithm.
- **MediaSession integration** (medium) — lock-screen controls, audio-session interop with TTS. Check if `MediaSessionService` from Phase 1 is already wired.
- **Full Sarum tone library** (large, editorial) — beyond the 9-tone smoke set.
- **Exsurge vendoring** (small, when needed) — `cp -R app/node_modules/exsurge/{src,assets,dist,package.json,LICENSE} app/vendor/exsurge/`, switch the package.json reference. Do this when bus-factor-1 risk feels real.

### 3. Verify before claiming done

The recurring failure-mode this session: the worker rebuilds + copies files into `app/node_modules`, but ng serve has an in-memory webpack cache that doesn't see the new code. **Always restart ng serve** after a worker reports completion. Don't trust webpack to hot-reload `node_modules` changes on this Angular 12 setup.

After restart:
- Open `http://localhost:4200/psalter`
- Force `chantNotation: 'always'` + `psalmsBold: 'all'` via the gear modal or programmatically
- Use Playwright MCP to inspect the served bundles — `for f in 6573 3724 2312 8739 ...; do curl http://localhost:4200/$f.js | grep -oE "newSymbol"; done` — to confirm the new code reached the browser

## Key file paths (cheat sheet)

- `ldf/src/chant/generate-gabc.ts` — GABC + pitch sequence emitter
- `ldf/src/chant/point-psalm.ts` — pointer (CMU stress lookup integrated)
- `ldf/src/chant/resolve-psalm-tone.ts` — tone resolver
- `ldf/src/chant/stress-lookup.ts` — CMU dict wrapper (build-time only)
- `commonprayer/src/chant/{tones,pointing,psalm-tone-assignments.json}` — source data
- `app/src/offline/chant/` — runtime-served copies (synced via `scripts/sync-chant-offline.js`)
- `components/src/components/{chant-pointing,chant-notation,chant-player}/` — runtime components
- `components/src/components/psalm/psalm.tsx` — orchestrator (loads tone table, renders chant elements)
- `app/src/index.html` — global @font-face + Exsurge + Tone.js script tags
- `app/angular.json` — asset entries for fonts + Exsurge + Tone

## Suggested first prompt for next session

> "Resume the chant Phase 2 work on `ithinkicam/venite`. We're at master `6c60b279`. Read `.planning/CHANT-PHASE-2-RESUME.md` for the full context, then pick up with **audio polish — vocal timbre** (replace Tone.Synth sine with Tone.Sampler + a vocal SoundFont). Restart ng serve first per the recipe in §How to resume."
