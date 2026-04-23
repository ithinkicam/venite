# Chant integration — design document

Adds plainchant support to Venite as an **aid for people learning to chant the Daily Office** — text pointing, GABC notation via Exsurge.js, and dynamic MIDI-style audition of psalm tone skeletons. Not a player that chants for you.

## Encoding

**GABC is the sole notation format.** ~19,000 CC0 chants in GregoBase (2024 dump); ~52 KB gzip for Exsurge. Exsurge.js renders GABC to SVG (lazy-loaded). No MusicXML, no ABC, no MEI. One format, one renderer, one corpus.

## Data model

### New types in `ldf/src/chant/`

**`ChantData`** — optional on `Psalm.metadata`, `Refrain.metadata`, `Text.metadata`, `ResponsivePrayer.metadata`:
```typescript
interface ChantData {
  toneId?: string;           // kebab-case slug: "tone-1-a-4"
  tradition?: string;        // 'sarum' | 'roman' | 'pmms' | 'st-dunstan' | string
  mode?: number | string;    // 1-8 or 'peregrinus'
  gabc?: string;             // inline GABC for through-composed settings
  source?: string;           // editorial attribution
}
```

**Tone data shape** — authoritative source: `ldf/src/chant/tone-file.ts` + sibling files (`tone-variant.ts`, `differentia.ts`, `mediation.ts`, `neume-group.ts`, `pitch.ts`). One JSON file per base tone (`tone-1.json` … `tone-8.json` + `tone-peregrinus.json`) contains a `ToneFile` whose `variants` array holds one `ToneVariant` per usable mediation variant (Tone I.A, I.B, etc.).

Summary of the shape (see source for full field docs):

- `ToneFile` → `{ id, mode: 1–8 | 'peregrinus', name, variants: ToneVariant[] }`
- `ToneVariant` → `{ id, label, isDefault, intonation: Pitch[], recitingTone: Pitch, secondRecitingTone?, mediation, mediationVariant?: 'standard' | 'abrupt', differentiae: Differentia[], intonations?: { standard, solemn?, gospelCanticle? }, useFor?, recordings? }`
- `Differentia` → `{ id, label, termination: { cadence: NeumeGroup[] } }` — mediation + termination are fixed pairs, not independent axes.

Notable fields:

- `secondRecitingTone` — supports Tonus Peregrinus (distinct reciting note in the second half-verse).
- `mediationVariant: 'abrupt'` — medieval mediations that cadence onto the accent without standard preparation notes.
- `intonations` — multiple intonation patterns (`standard` / `solemn` / `gospelCanticle`) per variant; Gospel canticles get their own solemn forms.
- `recordings?` — Phase-2 slot for reference audio per variant; empty today, populated when Tone.js synthesis and/or linked canticasacra.org recordings land.

ID format: kebab-case (`tone-1-a-4`). Display: `formatToneId("tone-1-a-4") => "I.A.4"`. Schema: **Mode.MediantCadence.FinalCadence** per St Dunstan's Table of Sarum Tones.

**`PsalmPointing`** — on `Psalm.metadata.pointing`. Source: `ldf/src/chant/pointing.ts`.
```typescript
interface PsalmPointing {
  verses: { [verseNumber: string]: VersePointing };
}
interface VersePointing {
  mediantAccent?: number;        // syllable-from-end index on the mediation cadence
  finalAccent?: number;          // syllable-from-end index on the termination cadence
  caesura?: number;              // optional word-from-start index for a light break
  flex?: { wordFromEnd: number; inflected: boolean }; // mid-verse flex for long single-line verses
  preparatorySyllables?: number[];                    // syllables-from-end that take preparatory notes
  intonationWords?: number;                           // words from the start carrying the intonation (v1)
  ending?: 'dactylic';                                // exceptional non-trochaic cadence (~8%)
}
```

**`PsalmToneAssignment`** — lookup record (parallels `CanticleTableEntry`):
```typescript
interface PsalmToneAssignment {
  source: 'st-dunstan' | 'plainsong-psalter' | 'user' | string;
  psalm: string;             // "23", "119-aleph", "18-1"
  toneId: string;            // "tone-1-a-4"
  season?: string;
  day?: string;
  weekday?: string;
  evening?: boolean;
  partNumber?: number;       // for split psalms
}
```

### Where things live

- **Types**: `ldf/src/chant/`
- **Tone formulas (JSON)**: `commonprayer/src/chant/tones/*.json` → mirrored to `app/src/offline/chant/tones.json`
- **Tone assignments (JSON)**: `commonprayer/src/chant/assignments/*.json` → mirrored to `app/src/offline/chant/assignments.json`
- **Pointing data**: on individual psalm docs (`metadata.pointing`)
- **Through-composed GABC**: on individual docs (`metadata.chant.gabc`)

### Display settings additions

```typescript
// in DisplaySettings:
chantNotation: 'off' | 'collapsed' | 'always' | 'tablet-only' = 'off';
// chantTradition as a Preference:
chantTradition: 'sarum' | 'roman' | 'pmms' | 'st-dunstan' | 'none' = 'none';
```

## 22 design decisions

| # | Decision | Answer |
|---|---|---|
| 1 | Accent index direction | Count from end of half-verse |
| 2 | Dactylic vs trochaic | Explicit field; only marked on exceptions (~8%) |
| 3 | Flex | Derived (whole step below tenor); no field on PsalmTone |
| 4 | Gloria Patri | Same tone as psalm; no special field |
| 5 | Canticle tones | Through-composed default + psalm-tone override when antiphon present |
| 6 | Syllable splitting | Word-level from end; vowel heuristic for accented word |
| 7 | Intonation | First verse of each psalm only |
| 8 | GABC rendering | Tone skeleton at top of psalm; text pointing below (not per-verse staves) |
| 9 | Tone data source | St Dunstan's Table of Sarum Tones PDF (in `resources/`) + user spreadsheet |
| 10 | Tone library scope | Smoke-test (8 tones + Peregrinus) then full Sarum table |
| 11 | Tone ID format | kebab-case slugs (`tone-1-a-4`), `formatToneId` helper for display |
| 12 | Psalm pointing | Algorithmic first pass + `/chant-pointing` skill for ongoing corrections |
| 13 | First psalter version | BCP 1979; architected for multi-version |
| 14 | Marian antiphons | Latin only from GregoBase CC0; English deferred |
| 15 | Collect/lesson tones | Ferial + festal |
| 16 | Hymn cycle | Compline hymns only; expand later |
| 17 | Exsurge source | Most active fork; pin to SHA; adapter-wrapped for swap |
| 18 | Font | ExsurgeChar.otf (bundled with Exsurge). |
| 19 | Mobile layout | `DisplaySettings.chantNotation` with device-class defaults |
| 20 | Default state | Off; opt-in via settings |
| 21 | TTS coexistence | Both coexist; mutual pause via MediaSessionService |
| 22 | Audio | Tone.js for audio synthesis (Phase 2); no recordings shipped, but `PsalmTone.recordings?` slot exists. |

## Rendering pipeline

```
Psalms/canticles:
  PsalmText (verse/halfverse) + PsalmPointing + PsalmTone
  → generate-gabc.ts (runtime)
  → Exsurge.js → SVG (tone skeleton at top)
  + CSS accent overlay on text (pointing marks)
  + WebAudio synth of PsalmTone.playback ("Hear the tone" button)

Through-composed (Marian antiphons, hymns, versicles):
  metadata.chant.gabc (stored)
  → Exsurge.js → SVG (full score inline)
  + WebAudio synth of playback data
```

## Tone selection (open question)

Tone assignment per psalm is **not settled**. St Dunstan's, the Plainsong Psalter, and other traditions disagree. The architecture supports multiple assignment sources via `PsalmToneAssignment.source` — user preference cascades to select which source's assignments apply. Research on tone-determination rules (antiphon-mode-driven, seasonal, tradition-specific) is ongoing. The assignment table is content, not code — updating it requires no schema changes.

## Components

| Component | Purpose | Dependencies |
|---|---|---|
| `ldf-chant-notation` | Renders GABC to SVG | Exsurge.js (lazy-loaded) |
| `ldf-chant-pointing` | CSS accent overlay on verse text | None |
| `ldf-chant-player` | "Hear the tone" button; WebAudio synthesis | None (raw WebAudio API) |

All lazy-loaded. Users with chant off pay 0 KB.

## Phase plan

### Phase 1 — Schema + tone library + pointing + text overlay
- `ldf/src/chant/*` types
- Smoke-test tone library (8 tones + Peregrinus)
- `generate-gabc.ts` engine + unit tests
- `point-psalm.ts` algorithmic pointer applied to BCP 1979
- `ldf-chant-pointing` (CSS-only)
- Hand-point Ps 23 + Ps 95 as working examples
- `/chant-pointing` skill for iterative corrections
- Checkpoint with user

### Phase 2 — Exsurge + tone audition
- `ldf-chant-notation` (Exsurge wrapper, lazy)
- `ldf-chant-player` (WebAudio, lazy)
- App wiring: display settings, pray page footer, preference cascade
- Full Sarum tone library transcription

### Phase 3 — Through-composed GABC
- Latin Marian antiphons from GregoBase CC0
- Collect tones (ferial + festal) from St Dunstan's PDF
- Lesson tones from St Dunstan's PDF
- Compline hymns (Te lucis + 5 seasonal variants) from GregoBase

### Phase 4 — Seasonal tone engine
- `PsalmToneAssignment` table (multiple sources)
- Antiphon mode → tone resolution in compile-service.ts
- User preference for tradition cascading

### Phase 5 — Office hymn cycle + content expansion
- Expand to Mattins/Evensong seasonal hymns
- English Marian antiphon transcriptions (when done by user)
- Additional psalter version pointings (Coverdale, inclusive)
- Reference recordings linked (Coverdale only, canticasacra.org)

## Content sources

| Source | Content | License | Status |
|---|---|---|---|
| GregoBase (gregobase.selapa.net) | ~19,000 GABC chants (2024 dump) | CC0 | Import pipeline needed |
| St Dunstan's Plainsong Psalter | Tone table, collects, lessons, Marian antiphons, compline | PDF in `resources/` | Manual transcription needed |
| The Plainsong Psalter (Litton) | Tone assignments for BCP 1979 | PDF in `resources/` | Reference only (copyright) |
| User's Psalm Tone Table | Psalm-to-tone assignments (St Dunstan + Plainsong Psalter + custom) | User data | Screenshots captured in chat; to be formalized |
| canticasacra.org | Audio recordings of all 150 psalms (Coverdale) | Free | Deferred to Phase 5 |

## Files touched (Phase 1)

| Layer | Files | Nature |
|---|---|---|
| ldf/ | `src/chant/chant-data.ts`, `src/chant/psalm-tone.ts`, `src/chant/pointing.ts`, `src/chant/generate-gabc.ts`, `src/chant/format-tone-id.ts`, `src/chant/point-psalm.ts` (new); `src/psalm.ts`, `src/refrain.ts`, `src/text.ts`, `src/responsive-prayer.ts` (widen metadata); `src/display-settings.ts`; `src/index.ts` | 6 new, 6 edits |
| commonprayer/ | `src/chant/tones/*.json` (tone library); pointing on starter psalms | New content dir |
| resources/ | Already present: St Dunstan PDFs, Plainsong Psalter PDF | Reference only |

## Copyright guardrail

Design Decision #14 (Marian antiphons: Latin-only from GregoBase CC0; English deferred) stands as of 2026-04-22. The following printed sources are **reference only** — their editorial pointings, typography, English adaptations, and translations are copyrighted and must **not** be reproduced in Venite's shipped data:

- **St Dunstan's Plainsong Psalter** (Andrewes Press, 2002) — we draw on its **structural conventions** (dot for cadence start, asterisk for caesura, flex on long verses only, the ~8% dactylic-ending convention) but never copy its specific pointed verses.
- **Litton — The Plainsong Psalter** (1988) — tone assignments to BCP 1979. Reference for comparison only.
- **Anglican Chant Psalter** (1987) — reference for comparison only.

Ancient Sarum melodic formulas and Latin chant texts are public domain and free to include. Our editorial pointings (Ps 23, Ps 95, and any future corpus) are our own output, produced by the in-house algorithmic pointer + hand-correction via `/chant-pointing`.

## Phase 1 shipped

Phase 1 ran Apr 2026 across 43 commits on `claude/chant-phase-1` (Waves 0–6). What actually landed:

- **LDF types** (`ldf/src/chant/`): `pitch.ts`, `neume-group.ts`, `mediation.ts`, `differentia.ts`, `tone-variant.ts`, `tone-file.ts`, `chant-data.ts`, `pointing.ts`, `psalm-tone-assignment.ts`, `format-tone-id.ts`, `generate-gabc.ts`, `point-psalm.ts`. Metadata widened on `Psalm` / `Refrain` / `Text` / `ResponsivePrayer` to carry `ChantData` and `PsalmPointing`.
- **Tone library**: 9 JSON files (`tone-1.json` … `tone-8.json` + `tone-peregrinus.json`) in `commonprayer/src/chant/tones/`. Public-domain provenance; structural validation test in `ldf/tests/`.
- **Golden-fixture pointing**: hand-pointed Ps 23 + Ps 95 in `commonprayer/src/chant/pointing/` plus a pre-aggregated `psalms-bcp1979.json` for runtime lookup.
- **Pointing algorithm**: `point-psalm.ts` in-house adapter over vendored `bbloomf/jgabc/psalmtone.js` (Unlicense / public domain) + attributions in `ldf/src/chant/vendor/ATTRIBUTIONS.md`.
- **Stencil component**: `<ldf-chant-pointing>` (CSS overlay) in `components/src/components/chant-pointing/` (`chant-pointing.tsx` + `.scss` + `.e2e.ts`). Rendered inline by `<ldf-psalm>` when `metadata.pointing` is present. Psalm SCSS updated with decorated drop-cap for verse 1.
- **DisplaySettings additions**: three new fields — `chantNotation: 'off' | 'collapsed' | 'always' | 'tablet-only'`, `chantTradition`, `psalmsBold`. Positional constructor alignment fixed (commit `3121480b`) after a late UAT caught a mismatch.
- **DisplaySettings modal**: pickers for `chantNotation` and `psalmsBold` added; `DisplaySettingsModule` extracted so `/psalter` shares the same modal as `/pray` (commits `f55b95df`, `8aa92e63`).
- **Wire-through**: `displaySettings` now threaded through `<ldf-liturgical-document>` → `<ldf-psalm>` on `/pray`, `/psalter`, and `/daily-readings`. `<ldf-psalm>` performs a render-time fetch of the pointing table from `/offline/chant/pointing/psalms-bcp1979.json`.
- **Offline sync script**: `scripts/sync-chant-offline.js` aggregates `commonprayer/src/chant/tones/*.json` into `app/src/offline/chant/tones.json` (9 tones). Wired into `app/angular.json` assets. Pointing fixtures mirrored to `app/src/offline/chant/pointing/`.
- **Psalter default**: default psalm on `/psalter` changed from 1 → 23 so the golden fixture is the first thing users see (commit `23c9b73a`).
- **Skill**: `/chant-pointing` skill definition at `.planning/skills/chant-pointing.md` for iterative pointing correction.
- **Tests**: 205 ldf tests pass (5 pre-existing baseline failures documented in `.planning/BASELINE-KNOWN-ISSUES.md`); Stencil e2e + Karma smoke spec for pray page added.

See `.planning/PHASE-1-SUMMARY.md` for the tight reference-card version.
