# /chant-pointing skill

**Purpose:** Given one or more BCP psalm verses and a proposed `VersePointing`,
critique the pointing against St Dunstan's *structural* conventions and emit a
corrected `VersePointing` JSON block ready to paste into
`commonprayer/src/chant/pointing/<psalm>.json`.

**When to invoke:**
- At Gate 2 of Phase 1 execution, when reviewing the initial Ps 23 / Ps 95
  fixtures produced by `wave2-fixtures`.
- Any time a new psalm is being hand-pointed and the editor wants a
  consistency check.
- When a test in `ldf/tests/point-psalm.test.ts` flags a fixture divergence
  and the editor needs to decide which reading is right.
- During Phase 2+ whenever a user reports that a psalm "sings wrong."

---

## How it works

### Input (user provides, in the chat)

- **Psalm reference** — e.g. `Ps 23 v4`, or a range `Ps 95 vv1-3`.
- **Verse text** — both halves if applicable. Include the `*` caesura and
  any line breaks from the source psalm JSON so the skill can see the
  half-verse split.
- **Current `VersePointing` JSON** — whatever the pointer produced, or empty
  if this is a first pass.
- **Specific question** *(optional)* — e.g. "is 'comfort me' dactylic?" or
  "should finalAccent be 0 or 1 here?"

### Output (assistant, per verse)

1. **Transcribe the verse** with syllable breaks and stressed syllables
   marked. Use standard English lexical-stress conventions (primary stress
   uppercase, secondary stress italicised in prose explanation).
2. **Apply the conventions** (see reference below):
   - Mediant accent — word index **from the end of the first half-verse**.
   - Final accent — word index **from the end of the second half-verse**.
   - Flex — only on long verses (first half roughly >12 syllables, or
     wherever the source text already has an internal comma + linebreak);
     word index from end.
   - Intonation — verse 1 only; `intonationWords: 2` is the norm,
     occasionally 3 when the intonation formula itself is long.
   - Dactylic ending — only when the last word (or terminal word group) is
     stress-unstress-unstress, e.g. `COM-fort-me`. Record via
     `ending: 'dactylic'`.
   - Abrupt mediation — when the mediant cadence lands on a
     dactylic-stressed mediant word. The schema doesn't capture this
     directly; **note it in the explanation** so the tone selector can pick
     an abrupt-mediation variant.
3. **Emit the corrected `VersePointing` JSON** — copy-paste ready, valid
   against the schema in `ldf/src/chant/pointing.ts`.
4. **If multiple valid readings exist**, explain the alternatives and
   recommend one, with a one-sentence rationale.

---

## Conventions reference (structural only, no copyrighted pointings)

- **Dot (·)** in the St Dunstan typographical system marks *start of the
  cadence*. In our schema, the cadence start is derived from
  `mediantAccent` / `finalAccent` **combined with** the tone's
  `mediation.cadence` length (counted backward from the accented word).
- **Asterisk (`*`)** is the caesura — encoded in the source psalm JSON's
  `verse`/`halfverse` split, **not** in `VersePointing`. Never put caesura
  info in the pointing file.
- **Flex marker (†)** — only for long first halves. Use
  `flex: { wordFromEnd, inflected }` where `wordFromEnd` counts from the
  end of the first half-verse.
- **Strong (⁻) vs weak (ˇ) inflection marks** over a flex syllable —
  Phase 1 schema captures this as `flex.inflected: boolean`; default is
  `true` (strong). Set `false` only for an explicitly weak flex.
- **Intonation** — applies to verse 1 only (standard psalter convention).
  First 2 words (occasionally 3) take the tone's `intonation: Pitch[]`
  sequence. Encode as `intonationWords: 2` on v1 only.
- **Ending classification** — `ending: 'dactylic'` marks a
  stress-unstress-unstress verse-final word group. Leave undefined for
  ordinary trochaic or monosyllabic endings.

### Word-index counting rules

- `mediantAccent` and `finalAccent` are **word indices from the end** of
  the relevant half-verse, 0-based. `0` = last word; `1` = second-to-last;
  etc.
- Count real words only — not punctuation, not the `*` caesura.
- When the last word is a weak clitic (`me`, `him`, `us`, `it`), the
  cadence usually lands on the preceding lexical stress; the index will
  then be `1` (or more) rather than `0`.

### Dactylic heuristic

The final cadence is **dactylic** when the last two syllables after the
accented syllable are both unstressed. Typical English patterns:

- `COM-fort-me` — stress on "com", then "fort" + "me" unstressed → dactylic.
- `wil-DER-ness` — stress on "der", then "ness" unstressed + nothing after →
  not a three-syllable dactyl at the word level, but functions dactylically
  if the preceding word is an unstressed monosyllable (`the wil-DER-ness`).
- `TRUST in HIM` — not dactylic; final word carries stress.

When uncertain, prefer **non-dactylic** (omit the `ending` field) and flag
the question in the recommendation.

---

## Copyright guardrail

All output is **Venite's editorial judgment** based on publicly-stated
*structural* rubrics. **Never reproduce specific pointings** from:

- *St Dunstan's Plainsong Psalter* (Andrewes Press 2002)
- *The Plainsong Psalter* (Litton, 1988)
- *The Anglican Chant Psalter* (1987)
- Winfred Douglas's English adaptations or any successor edition

When the user asks "what does St Dunstan do for this verse?", respond:

> I can't consult a copyrighted edition's specific pointings. Here are the
> conventions and my editorial judgment applying them.

If the user pastes a pointing that looks like it was transcribed from a
copyrighted psalter, accept it as *their* editorial input and critique it
structurally — but do not confirm or deny that it matches any published
edition.

---

## Example invocations

### Example 1 — new verse, no pointing yet

**User:**

> /chant-pointing Ps 34 v8 — "Taste and see that the LORD is good; *
> happy are they who trust in him!"

**Skill output:**

- **First half:** *Taste and see that the LORD is good*
  - Syllables: `Taste` `and` `see` `that` `the` `LORD` `is` `good`
  - Last stressed word is **"good"** (monosyllabic, primary stress).
  - `mediantAccent: 0` (word index 0 from end).
- **Second half:** *happy are they who trust in him*
  - Syllables: `HAP-py` `are` `they` `who` `TRUST` `in` `him`
  - "him" is a clitic pronoun with weak stress. Convention: cadence lands
    on the preceding lexical stress, "TRUST".
  - `finalAccent: 1` (second-to-last word).
- **Flex:** none — first half is 8 syllables, well under the flex threshold.
- **Intonation:** only if this is v1 of the psalm. Ps 34 v8 is mid-psalm,
  so omit.
- **Ending:** not dactylic — final word group is `trust in him` which
  parses as an iambic-ish phrase, not stress-unstress-unstress.

```json
{
  "mediantAccent": 0,
  "finalAccent": 1
}
```

### Example 2 — correction, alternate readings

**User:**

> /chant-pointing Ps 95 v4 final half = "are his also" — should
> finalAccent be 0 (also) or 1 (his)?

**Skill output:**

- **"also"** is the last word; stress is **AL**-so (trochaic in
  standard liturgical reading).
- **"his"** is a weak possessive; variable stress depending on
  emphasis — usually clitic.
- **Primary reading:** cadence lands on "also" (last word carrying
  primary lexical stress). `finalAccent: 0`.
- **Alternative reading:** if the pastoral reading emphasises **HIS** for
  contrast ("…the sea is God's, and HIS also"), then `finalAccent: 1`.
- **Ending:** non-dactylic (final word is two syllables, trochaic).

**Recommendation:** `finalAccent: 0`. Rationale: the canonical structural
reading puts the cadence on the final primary-stressed word; the
contrastive reading is expressive rather than structural.

```json
{
  "mediantAccent": 0,
  "finalAccent": 0
}
```

### Example 3 — long verse requiring a flex

**User:**

> /chant-pointing Ps 95 v7 — "For he is our God, and we are the people of
> his pasture and the sheep of his hand. * Oh, that today you would
> hearken to his voice!"
> Current pointing: `{ "mediantAccent": 0, "finalAccent": 0 }`

**Skill output:**

- **First half** is long (~22 syllables) and has a natural comma after
  "God". A flex is warranted there.
- Counting words from the end of the first half (`sheep of his hand` =
  words 3, 2, 1, 0; `pasture and the sheep...` stretching back), "God"
  falls at `wordFromEnd: 14`.
- The flex syllable is a strong stressed monosyllable — `inflected: true`.
- **Mediant accent:** falls on "hand" (last word). `mediantAccent: 0`.
- **Final accent:** falls on "voice" (last word). `finalAccent: 0`.
- **Ending:** not dactylic (monosyllabic final word).

```json
{
  "mediantAccent": 0,
  "finalAccent": 0,
  "flex": { "wordFromEnd": 14, "inflected": true }
}
```

### Example 4 — dactylic final

**User:**

> /chant-pointing Ps 23 v4 — "Yea, though I walk through the valley of the
> shadow of death, I will fear no evil; * for thou art with me; thy rod
> and thy staff, they comfort me."

**Skill output:**

- **Final half** ends with "comfort me". Stress is **COM**-fort-me —
  stress-unstress-unstress across two words, classic dactylic.
- Cadence lands on "comfort" (the stressed word). Counting from the end:
  `me` = 0, `comfort` = 1 → `finalAccent: 1`.
- Mark `ending: 'dactylic'`.
- **First half** is long; a flex at "evil" (or earlier, depending on the
  half-verse split) is appropriate. If the source JSON splits the verse
  at `*` and the first half still reads as one long line, flex on the
  comma after "death": word index from end of first half depends on the
  exact word count.
- **Mediant accent:** on the last word of the first half.

```json
{
  "mediantAccent": 0,
  "finalAccent": 1,
  "flex": { "wordFromEnd": 5, "inflected": true },
  "ending": "dactylic"
}
```

---

## Schema fields produced (from `ldf/src/chant/pointing.ts`)

```ts
export interface VersePointing {
  mediantAccent?: number;
  finalAccent?: number;
  caesura?: number;
  flex?: { wordFromEnd: number; inflected: boolean };
  preparatorySyllables?: number[];
  intonationWords?: number;
  ending?: 'dactylic';
}
```

Only emit fields that are needed. Omit `caesura` in almost all cases — the
source psalm JSON already encodes the caesura via the half-verse split.
Omit `preparatorySyllables` unless the editor has specific prior-art
evidence that the default pointer is choosing the wrong preparatory
syllable.

---

## Installing as a Claude Code skill

This file IS the skill definition. To use as a native Claude Code slash
command:

```bash
mkdir -p ~/.claude/skills/chant-pointing/chant-pointing
cp .planning/skills/chant-pointing.md ~/.claude/skills/chant-pointing/chant-pointing/SKILL.md
```

Then `/chant-pointing` is available in any Claude Code session on this
machine.

Alternatively: paste the contents of this file as a system prompt (or
prepend to a user turn) in any conversation with Claude where pointing
work is happening.

---

## References

- Schema: `ldf/src/chant/pointing.ts`
- Example fixtures: `commonprayer/src/chant/pointing/psalm-23.json`,
  `commonprayer/src/chant/pointing/psalm-95.json`
- Pointing conventions research: `.planning/research/chant-pdfs.md` § 2
- Pointer algorithm: `ldf/src/chant/point-psalm.ts`
- Phase plan task spec: `.planning/PHASE-1-PLAN.md` — search "W4.1"
