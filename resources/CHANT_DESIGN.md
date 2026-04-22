# Chant integration — design document

Adds plainchant support to Venite as an **aid for people learning to chant the Daily Office** — text pointing, GABC notation via Exsurge.js, and dynamic MIDI-style audition of psalm tone skeletons. Not a player that chants for you.

## Encoding

**GABC is the sole notation format.** ~14,000 CC0 chants in GregoBase. Exsurge.js renders GABC to SVG (~200KB, lazy-loaded). No MusicXML, no ABC, no MEI. One format, one renderer, one corpus.

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

**`PsalmTone`** — reference data (NOT an LDF doc type). Lives in tone library JSON:
```typescript
interface PsalmTone {
  id: string;                    // "tone-1-a-4"
  mode: number;
  mediant: string;               // "A" | "B" | "C" | "S" | "default"
  finalCadence?: string;         // "1"-"14", "York", "Gloucester", etc.
  intonationGabc: string;        // GABC fragment
  recitingNote: string;          // pitch letter
  mediantCadenceGabc: string;    // GABC fragment
  finalCadenceGabc: string;      // GABC fragment
  label?: string;                // "Gloucester", "York", etc.
  useFor?: string[];             // ['benedictus', 'magnificat'] for solemn forms
  playback: {                    // for dynamic tone audition
    intonation: Note[];
    reciting: Note;
    mediant: Note[];
    final: Note[];
  };
}
interface Note { pitch: string; duration?: number; }
```

ID format: `tone-1-a-4` (kebab-case). Display: `formatToneId("tone-1-a-4") => "I.A.4"`.

Schema: **Mode.MediantCadence.FinalCadence** per St Dunstan's Table of Sarum Tones.

**`PsalmPointing`** — on `Psalm.metadata.pointing`:
```typescript
interface PsalmPointing {
  verses: { [verseNumber: string]: VersePointing };
}
interface VersePointing {
  mediantAccent?: number;    // word index from END of first half-verse
  finalAccent?: number;      // word index from END of second half-verse
  flexAccent?: number;       // word index from END (before mediation, for long verses)
  ending?: 'dactylic';       // only when not trochaic (~8% of English verses)
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
| 18 | Font | Caeciliae (Exsurge default) |
| 19 | Mobile layout | `DisplaySettings.chantNotation` with device-class defaults |
| 20 | Default state | Off; opt-in via settings |
| 21 | TTS coexistence | Both coexist; mutual pause via MediaSessionService |
| 22 | Audio | No recordings; all audition is dynamic synthesis from PsalmTone.playback |

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
| GregoBase (gregobase.selapa.net) | ~14,000 GABC chants | CC0 | Import pipeline needed |
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
