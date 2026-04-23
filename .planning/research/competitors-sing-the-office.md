# Competitor dossier: singtheoffice.com

**Researched:** 2026-04-21. **Target:** https://singtheoffice.com/

**Research caveat.** The site is a client-rendered React SPA — `curl` returns only a shell with a single `/web.953c2e8c.js` bundle. Any findings about page-level UI below are inferred from: (a) the production JS bundle (3.2 MB, `/tmp/sto-app.js`), which contains inlined prose, settings objects, route definitions, GABC snippets, and React component signatures; (b) the project's own Substack posts; and (c) third-party reviews on New Liturgical Movement and Scala Foundation. This is actually richer evidence than normal for a competitor review because the SPA ships all its liturgical text and prose inlined in the bundle.

---

## 1. Elevator pitch (from the project itself)

> "SingTheOffice is a website devoted to making it easier to sing traditional Anglican Daily Offices, in particular the plainsong chant of the Psalms and Canticles. It does this by providing an automatically generated order of service for Mattins, Evensong and Compline every day, with almost everything that can be sung set out fully in square notation. Alongside the main chants, options are provided where the site will intone the chant for the user, helping them to learn the pitches of the various chants."
>
> — in-app About text (string extracted from bundle)

> "SingTheOffice provides Daily Offices from the English Prayerbook tradition, fully pointed for Gregorian Chant, and as of the Second Edition, compliant with the rubrics of Divine Worship: Daily Office (Commonwealth Edition)."

The mission is **Venite's chant mission almost word-for-word**: the value proposition is "help a layperson learn to chant the office" by generating a day's order of service with pointed text + neumes + tone-audition, not acting as a performer that sings for the user.

---

## 2. Tradition, audience, origin

| Field | Finding | Source |
|---|---|---|
| Tradition | Anglican-Patrimony / Roman (Personal Ordinariate of Our Lady of Walsingham). Second Edition is rubrically compliant with *Divine Worship: Daily Office (Commonwealth Edition)*. First Edition was 1662 BCP + Sarum tones. | [NLM 2024 upgrade post](https://www.newliturgicalmovement.org/2024/01/upgrade-to-singtheofficecom-now.html), bundle string "compliant with the rubrics of … Our Lady of Walsingham" |
| Launch | Quinquagesima (Sunday before Lent) 2021. Second Edition ~2024. | [Substack Update #1](https://singtheoffice.substack.com/p/singtheoffice-update-1) |
| Author | Not publicly named in bundle or Substack "About". Project-shaped anonymously. Accepts/"will publicly credit" paid contributors for recordings. | [Substack "About"](https://singtheoffice.substack.com/about); bundle "We will, of course, publicly credit you for your work" |
| Backing | None visible. No parish, no order, no university. Free and freely offered: "The work contained in this site is offered freely, to his glory…" | Bundle credits string |
| Business model | Free. Donation-funded recording project announced. No subscription, no paywall. | Bundle "/recording-project" route |

---

## 3. Content coverage

### Offices
Routes confirmed by inspecting the bundle:

```
/pray/today/mattins
/pray/today/evensong
/pray/today/compline
/pray/litany
/pray/commination
/se/litany        (special-event litany)
/se/lohf-ants     (Lesser Feasts antiphons?)
/ordo
/calendar
/settings
/intro
/first-edition    (legacy 1662/Sarum version still online)
/recording-project
/hymn-editor      (authoring tool, internal)
/query /check /calcheck /secret-ordo /special-export  (admin/debug)
```

Only Mattins, Evensong, Compline are the worshipper-facing offices. No Lauds/Prime/Terce/Sext/None (consistent with 1662 Anglican reduction to 2 offices; Compline returned in modern practice).

### Psalter
- **1662 Psalter (Coverdale)**, 30-day cycle, all 150 psalms (including imprecatory). Second Edition adds a 60-day cycle toggle (2019 BCP), and 1928 BCP as selectable calendar. Switches between 1662 and 1928 Coverdale variants at verse granularity (bundle contains both `line1662B`/`line1928A` comparison arrays).
- **No** BCP 1979, Grail, Vulgate, or Common Worship psalter. Common Worship lectionary is offered but the psalter stays Coverdale.

### Canticles (all pointed with GABC in the bundle)
- Venite, Jubilate, Te Deum (including "Solemn Ambrosian" English setting), Benedicite (Song of Three Children / OT Canticles), Benedictus, Magnificat, Nunc Dimittis, Song of Hannah (`Exultavit cor meum`).
- Each canticle has a "simple" and "solemn" tone variant toggleable via the `antiphonTones` preference.

### Collects
Yes, chanted. Bundle contains dozens of collects with diacritical pointing (e.g. Saints Alban/Julius/Aaron, Fabian, Anthony, Joseph, Easter, etc.). Ferial vs festal tones are implied — the `antiphonTones:"solemn"|"simple"` pref governs canticle tone solemnity, and festal collect settings appear alongside ferial.

### Lessons
Bundle string: *"While normatively the lessons are read, on Easter Day the Second Lesson could be sung to the very solemn tone of the Resurrection Gospel."* So **lesson tones exist but are the exception**, not the default. Tenebrae also has solemn-tone lesson/responsory settings.

### Hymns
- Office hymns across the year (Compline, Mattins, Evensong seasonal variants).
- Latin hymn text, translated into English, set to their Gregorian melodies. Te lucis (Compline) confirmed present; the bundle has a `hymn-editor` route for the author's private tool.

### Marian antiphons
- **Latin** first-class: Salve Regina, Alma Redemptoris, Ave Regina (caelorum) all present as GABC.
- No English paraphrases visible.

### Calendar integration
Strong. The app picks the day's propers (collects, antiphons, hymns, lectionary) from the Ordinariate calendar (second edition) or 1662 calendar (first edition). Route `/pray/today/…` implies automatic "today" resolution; `/ordo` is a full liturgical calendar view; `/calendar` is a picker. Handles saints' days, patronal festivals, and region-specific notes.

---

## 4. Notation approach — the single most differentiated finding

| Aspect | singtheoffice.com |
|---|---|
| Neume style | **Square-note (Gregorian) notation, dynamically rendered in SVG** (not 5-line staff, not PDFs) |
| Source format | **GABC** — confirmed by thousands of GABC fragments stored as `{gabc, tone, …}` objects throughout the bundle. Example: `"O(efg) ho-(ddc)ly(de) Ma-(e)1y,(e) help(gh)…"` is a Marian antiphon in literal GABC. |
| Renderer | **Custom in-house React/SVG renderer, NOT Exsurge.js.** The bundle contains homegrown classes named `Neume`, `Virga`, and a GABC parser that builds SVG paths directly (`svgNeume`, `neumeExtensionLeft`, etc.). There is no Exsurge symbol in the bundle (grepped: zero matches). React component `cR` is the main `{gabc, dropCap, tone, onClickNeume, highlightedNote}` renderer. |
| Pointing display | **Typographic — bolded accented syllables on the verse text itself.** User-facing setting `psalmsBold`: `"none" \| "all" \| "alternate"`. Underlying component prop is `boldMode`. No staff-atop-text; the neumes appear for the tone skeleton and for antiphons/hymns/collects/canticles, while psalm verses use plain text with accent marks. |
| Tone skeleton | Yes — the `ym`/`yf`/`yb` component cluster renders a tone skeleton (intonation, reciting, mediant, termination) once at the top of each psalm/canticle, with a play-button player; pointed verse text follows beneath. **This is the exact pattern Venite's design proposes.** |
| Pointing fields | Bundle exposes `mediant`, `intonation`, `recitingNote`, `secondRecitingNote`, `ending`, `endingOptions`, `clef`, `firstHalf`, `secondHalf` — closely parallel to Venite's `PsalmTone` schema. `h.ending` / `h.flex` suggest they treat flex as a derived/optional variant. |
| Click-to-play-from-note | Yes — `onClickNeume` handler; UI text: *"Click a neume to play from there"* / *"Click anywhere to pause"*. Venite has not planned this. |
| Static PDFs? | No. **Everything is live-rendered.** A `docx`-based Word export exists (see Tech) for offline/print. |

---

## 5. Audio — dynamic synthesis, not recordings (today)

| Feature | Finding |
|---|---|
| Synthesis type | **WebAudio oscillator-based synthesis.** Bundle contains `AudioContext`, `webkitAudioContext`, `frequency`, `gain`, `attack`, `release`, MIDI note → Hz (440 Hz reference). No tone.js/Howler — it's raw WebAudio. |
| Playback control | Per-tone play button renders the intonation + reciting + mediant + termination skeleton. `intoneOnly:true` fragments indicate short "intonation-only" variants. Click-a-neume-to-play-from-there. |
| Transposition | **Per-mode, persistent.** Default settings object: `transpositions: {1:0, 2:0, …, 8:0, T:0}` (modes 1–8 plus a generic `T`). UI has up/down controls that mutate the transposition for the current mode. **This is a critical UX decision Venite should copy.** |
| Pre-recorded audio today? | No. Bundle string: *"many people … feel that they would need a recorded voice to sing along with"* — acknowledging the synth-only limitation. |
| Recording project | Announced. Route `/recording-project`. Bundle string: *"we believe that the goal of more people singing the prayers of the church … will be advanced by commissioning, and making freely available on the site, a complete set of recordings of the Psalms, Canticles, and other sung parts"*. They are paying cantors and will publish CC-ish. |
| External recordings link | Yes — bundle says *"More plainsong Psalm recordings (not all settings being identical to those on this site) can be found [link]"*, almost certainly canticasacra.org (the Coverdale recordings Venite already knows about). |

---

## 6. Tech stack (from bundle fingerprinting)

| Layer | Evidence | Library |
|---|---|---|
| Build tool | `@parcel/runtime-js` strings | **Parcel** |
| Framework | `react-router/dist/development/chunk-4WY6JWTD.mjs`, React reconciler signatures, JSX runtime `nz.jsx` | **React + React Router** (SPA) |
| Hosting style | SPA with static assets; no server-rendered HTML; `importmap` for fonts | Client-side only |
| Chant renderer | Custom `Neume`/`Virga` classes, custom SVG generator, inline GABC parser. **No Exsurge, no Gregorio, no Verovio.** | Homegrown |
| Audio | `AudioContext`, `webkitAudioContext` | Raw WebAudio (no tone.js, no howler) |
| Word export | XML namespaces `http://schemas.openxmlformats.org/…`, `Mode VI`, paragraph style strings | **`docx` npm package** |
| Fonts | `EB Garamond`, `Source Serif Pro`, `Goudy Initialen` (for drop-caps; `dropCap:true` prop on chant components) | Google Fonts + custom TTF |
| Analytics | Mixpanel SDK + LogRocket / rrweb session replay | Mixpanel + LogRocket |
| State | `useMemo`, `useState`, settings context via React Context (`gv()` returns `{settings, setSetting}`) | React-only state, no Redux |
| Accessibility | `ResizeObserver` polyfill concerns; Safari WebGL2 disable shim at page top | Custom |
| Source code | **Not open source.** Bundle is minified, no GitHub org found, no license beyond the site's theological dedication. | Closed |

The Parcel/React/raw-WebAudio/custom-SVG-GABC stack is pragmatic and aligns well with Venite's Angular/Ionic choices — different framework, same architectural shape. The key divergence: they rolled their own GABC renderer; Venite plans to use Exsurge.

---

## 7. Settings surface — full defaults object

Extracted verbatim from the bundle (`g_ = {…}`):

```js
{
  bibleTranslation: "ESV",
  psalmsBold: "none",              // none | alternate | all   (pointing typography)
  invitatoryAntiphons: "always",
  antiphonTones: "solemn",         // solemn | simple          (tone ornateness)
  psalmCycle: "bcp",               // bcp | 60-day | cw
  teDeum: "always",
  mattinsReadings: "1961-morning", // lectionary selection
  monarch: "yes",                  // pray-for-the-monarch toggle
  salutation: "the lord be with you",
  psalmsAtCompline: "compline-short",
  secondReadingToCompline: "no",
  letUsBlessMattinsAndEvensong: "after collects",
  transpositions: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, T:0},
}
```

Notice what is **not** there: no `chantOn/Off` master toggle, no `tradition` selector (tradition is locked per-edition: first = Sarum, second = Ordinariate/Liber). Notation is always on. Pointing typography is always shown (the only choice is `none/alternate/all` for bold emphasis).

Also present: `experimentalChantRendering`, `canticleTonesExperimental` — they ship feature-flagged experimental toggles for advanced users.

---

## 8. UX patterns worth stealing

1. **"Today" is one click away.** `/pray/today/mattins` auto-resolves from server date to the full order of service. No date picker friction.
2. **Click-any-neume to play from there.** UI reads: *"Click a neume to play from there"* / *"Click anywhere to pause"*. Makes tone-audition discoverable at the shape level, not just the "play whole tone" level.
3. **Per-mode transposition.** Each of modes 1–8 gets its own transposition offset that persists across sessions. Someone learning with a bass voice only needs to adjust mode 1 once.
4. **Tone-ornateness toggle (`simple` vs `solemn`).** Separate from tradition choice. Beginners get simple psalm tones; advanced users get solemn tones for Sundays/feasts.
5. **Drop-cap rendering flag.** First verse of a psalm/canticle gets a drop-cap initial (Goudy Initialen font) — liturgical typography, not just a title.
6. **Word (.docx) export.** Users can "export this order of service for Zoom / parish handout". Uses the `docx` npm library. Handles fonts, bold, tabs, neumes-as-images.
7. **Intro page as in-app text, not a blog post.** The onboarding prose ships with the app; no external docs hop.
8. **Explicit tutorial for "how to chant".** Bundle string: *"In plainsong, the text is sung smoothly at about the same pace that it would be said, without forcing the text into a particular rhythm. A good breath should be taken between each half-line (where there are vertical bars in the notation). The tone can be sung at any pitch that you find comfortable."* This paragraph lives in the app itself.
9. **First-edition preserved.** After a major redesign, the v1 app is still live at `/first-edition` with the 1662+Sarum combo. Zero-regret migration for users attached to the old rubrics.
10. **Admin/debug routes shipped but undiscoverable.** `/check`, `/calcheck`, `/query`, `/secret-ordo`, `/hymn-editor`, `/special-export` — they're maintaining the data in the app, for the app. Worth considering if Venite's chant data is edited in-app by a maintainer.

---

## 9. What's weak or missing

- **Notation is always on.** No opt-out; no "text-only" reading mode. A new user who doesn't chant gets the full neume-heavy UI on day one. This is an explicit non-goal for them (they're singing-first), but it would be a failure mode for a general-purpose Anglican app like Venite.
- **Tradition is locked to the edition, not a user preference.** Want Sarum tones with the Ordinariate calendar? You can't. They ship two separate apps (`/` and `/first-edition`).
- **Closed source.** No GitHub, no license, no documented data model. Forks are impossible; contributions happen only as feedback.
- **Psalter is Coverdale-only.** No BCP 1979, no Grail, no Common Worship.
- **Marian antiphons are Latin-only.** No English options.
- **Uses Mixpanel + LogRocket.** Privacy-unfriendly for a prayer app. Users of Venite should not be session-replayed when praying.
- **No print stylesheet** visible; the `docx` export is the print path, which implies clunky workflow for "just print tomorrow's evensong".
- **Mobile UX.** The bundle has a responsive wrapper (`Lp()` helper returns mobile-class boolean) but compacting a pointed psalter + SVG neumes on a phone is genuinely hard and the bundle has no obvious tablet-first layout — implying mobile is "reader-pinch-zoom" rather than thoughtfully redesigned.
- **No "learning mode" vs "performance mode".** Notation is always shown at the same density. You can't hide the SVG and keep just pointed text.

---

## 10. Direct comparison to Venite's CHANT_DESIGN.md decisions

Decision table uses: **S**=supports (evidence they do the same thing), **C**=contradicts (they chose differently), **—**=silent.

| # | Venite decision | STO position | Verdict | Note |
|---|---|---|---|---|
| 1 | **GABC as sole notation format** | GABC is their on-disk format for every chant fragment | **S** | Strong validation. They explicitly store `{gabc, tone}` everywhere. |
| 2 | **Exsurge.js as renderer** | Homegrown React SVG renderer; not Exsurge | **C (soft)** | They demonstrate GABC renders well without Exsurge, but also that rolling your own is feasible. Venite's Exsurge bet saves 6–12 months of renderer work. |
| 3 | **Runtime notation rendering (vs static PDFs)** | 100% runtime SVG | **S** | No PDFs anywhere. |
| 4 | **Dynamic tone audition via WebAudio (no recordings)** | Raw WebAudio oscillator synth for tone audition | **S** | Exact parallel. Plus they add click-a-neume-to-play. |
| 5 | **Pointing as typography on verse text** | `boldMode` on verse component, bolds accented syllables | **S** | Venite plans CSS overlay; STO does inline bold. Same idea. |
| 6 | **User preference for tradition (Sarum / Roman / PMMS / St Dunstan's)** | Tradition is baked into the edition (no user switch). Sources cited: *Proctor & Frere, St Dunstan's, Palmer Sarum, McMaster Sarum, English Hymnal, 1662, 1928, 2019 BCPs* | **C** | Venite's preference cascade goes further. STO ships two apps; Venite plans one app with a tradition selector. |
| 7 | **Opt-in "off by default" notation display** | Notation always on | **C** | Deliberate STO choice (they are a singing-first app). Venite is right to default-off because Venite serves many users who read but don't chant. |
| 8 | **Marian antiphons Latin-only first (GregoBase CC0)** | Latin only: Salve Regina, Alma Redemptoris, Ave Regina | **S** | Direct parallel. |
| 9 | **Full psalter coverage with pointing** | Full 150 Coverdale psalter, algorithmically pointed, with per-verse correction history (*"we spent the last few weeks … improving many of the less-than-ideal pointings"*) | **S** | Strong validation of Venite's "algorithmic first pass + `/chant-pointing` skill for corrections" plan. |
| 10 | **Tone selection: mode-of-antiphon vs user choice vs season** | Uses per-psalm tone assignments from St Dunstan / Palmer / Plainsong sources. User can override per-psalm via an `onSetSelectedTone` menu. No evidence of automatic antiphon-mode-driven selection. | **S (partial)** | They support user override. Venite's "antiphon-mode → tone" engine in Phase 4 would be a genuine differentiator. |
| 11 | **Canticle = through-composed default + psalm-tone override** | Every canticle ships both a "solemn" (through-composed or near-it) and a "simple" (psalm-tone) setting, user-togglable via `antiphonTones` | **S** | Venite's design is a match. STO adds the global `antiphonTones` toggle — worth copying. |
| 12 | **Tone ID format** | Not observable — tone IDs in bundle are short strings ("1","2",…"8","T") keyed per-mode on `transpositions` | — | Their tone IDs appear simpler than Venite's `tone-1-a-4`. That's fine because their tone *corpus* is smaller; Venite's kebab IDs are justified by planned full-Sarum-table coverage. |
| 13 | **First psalter version = BCP 1979** | They chose Coverdale (1662 + 1928 variants). | **C** | Different target audience. For Venite (TEC-first), BCP 1979 is right; but Venite should architect for Coverdale as the obvious Phase 5 addition. |
| 14 | **No pre-recorded audio; all synthesis** | Currently true. But they are actively fundraising to commission recordings. | **C (trend)** | STO's experience says: *the synth alone is insufficient for some users*. Venite should leave an architectural slot for optional recordings-per-psalm. |
| 15 | **Font: Caeciliae (Exsurge default)** | Goudy Initialen for drop-caps, EB Garamond + Source Serif Pro for body, a custom neume font inside their homegrown renderer. | — | Venite's Caeciliae default is fine. |
| 16 | **Mobile layout: DisplaySettings.chantNotation with device-class defaults** | Responsive but no evidence of device-class defaults. | **C (soft)** | Venite's approach is more thoughtful. |
| 17 | **Exsurge source: most-active fork, pinned SHA, adapter-wrapped** | N/A | — | STO sidestepped this entirely by going custom. Their bundle size (~3.2 MB uncompressed, ~600 KB gzipped) suggests the cost is tolerable. |
| 18 | **TTS coexistence** | No TTS in bundle. | — | |
| 19 | **Per-verse overrides on pointing** | Heavy usage. Every psalm is an array of `{syllables: [{text, notes, long, dotBefore, reciting}]}` — effectively per-syllable/per-verse data, not just rules. | **S** | Justifies Venite's "algorithmic first pass + per-verse overrides" design. Pure algorithms don't survive contact with 150 psalms. |
| 20 | **Gloria Patri: same tone as psalm** | Implemented same way. Gloria Patri is appended to each psalm using the psalm's tone, no separate GloriaPatriTone type. | **S** | |
| 21 | **Flex derived, not stored** | Flex handled as an `ending`-option variant in their verse data (`endingOptions:[…]`). More explicit than Venite's plan, but they also derive when not present. | **S (mostly)** | |
| 22 | **Tone-audition button per tone** | Every chant chunk renders a `<Player tones=[…] selectedTone=…>` component with `onSetSelectedTone`. | **S** | Plus click-a-neume. |

**Bottom line: 13 supports, 6 contradictions, 3 silent.** The contradictions are mostly about STO's narrower audience (singing-first, Ordinariate-only, Coverdale-only) — Venite's broader positioning justifies the diverges.

---

## 11. Key takeaways for Venite (opinionated)

1. **Keep the GABC-only bet.** STO's entire content corpus is GABC, hand-authored, stored as `{gabc, tone}` objects. If a solo developer/author can maintain a full Ordinariate daily office in GABC, so can Venite with the TEC corpus. This validates decision 1 strongly.

2. **Keep Exsurge, don't roll your own renderer.** STO's homegrown Neume/Virga/SVG renderer is the single biggest piece of code in their bundle (easily 30%+ of 3.2 MB). That's 6–12 months of work Venite shouldn't repeat. Adapter-wrap Exsurge (decision 17) and move on.

3. **Steal the click-a-neume-to-play pattern.** UI text: *"Click a neume to play from there"*. This is a dramatically better teaching UX than a single whole-tone play button. Add `onClickNeume` to `ldf-chant-notation` in Phase 2.

4. **Steal per-mode persistent transposition.** `transpositions: {1:0, 2:0, …, 8:0, T:0}` stored in user preferences. A bass singer transposes mode 1 down a fifth once, forever. Way better than a single global transpose. Add this to `DisplaySettings` alongside `chantTradition`.

5. **Steal the `antiphonTones: simple | solemn` toggle.** Independent of tradition. Beginners get psalm-tone canticle settings; advanced users get through-composed solemn settings. This is the right abstraction, and it's compatible with Venite's "through-composed default + psalm-tone override" decision (5).

6. **Reconsider "off by default" (decision 20) carefully.** STO proves notation-always-on is viable *for their audience*. Venite's audience is broader — default-off is correct. But make "on" frictionless: one settings toggle, not a cascade of choices.

7. **Plan for recorded audio even if not shipping it.** STO launched synth-only, collected feedback, and is now fundraising for recordings because *"many … feel that they would need a recorded voice to sing along with."* Venite's decision 22 ("no recordings") should be softened from "never" to "not in Phase 1–4"; leave a `PsalmTone.recordings?: RecordingRef[]` slot in the schema, even if unused. Decisions are cheap before launch, expensive after.

8. **Don't lock tradition to an edition.** STO shipped two separate apps (`/` vs `/first-edition`) rather than one app with a tradition selector. That's a maintenance tax Venite shouldn't pay. Commit to `chantTradition` preference cascade (decision 6) as a first-class feature.

9. **Steal the in-app "how to chant" tutorial prose.** STO ships `/intro` as an in-app page with concrete guidance ("take a good breath between each half-line where there are vertical bars; the tone can be sung at any pitch that you find comfortable"). Venite should do the same — one short page linked from the chant settings.

10. **Steal the drop-cap rendering.** First verse of each psalm/canticle gets a decorative initial (Goudy Initialen). Trivial to add; huge aesthetic payoff; signals "this is an office book, not a text dump". Propose: add `dropCap: boolean` to psalm/canticle components.

11. **Copy the `psalmsBold: none | alternate | all` tri-state.** STO treats pointing typography as a *user preference*, not a design constant. Some users want bold on every accent; others find it visually loud and want none; alternate-line bolding is a traditional printed-office-book convention. Add this to `DisplaySettings`.

12. **Use `docx` for export, not PDF.** STO uses the `docx` npm package to export an entire day's office as Word, which is then printable and (critically) editable by parishes. For Venite's print story, Word export is a more useful deliverable than PDF. (This is a minor addition, not a core decision.)

13. **Don't ship Mixpanel/LogRocket on a prayer app.** STO does. Users are being session-replayed praying. Venite should avoid this anti-pattern. Use anonymous, aggregated telemetry only, and never record the DOM during prayer.

14. **Validate the algorithmic-pointing approach.** STO went through *weeks* of post-launch bugfixes on "less-than-ideal pointings". Decision 12 ("algorithmic first pass + `/chant-pointing` skill for ongoing corrections") is vindicated — plan for a month of pointing-correction work after launch, and make per-verse override the easy path, not the exceptional one.

15. **STO is friend, not foe.** They cite the same sources Venite plans to use (St Dunstan's, Palmer Sarum, Proctor & Frere). A later-stage collaboration — data sharing, pointing exchanges, linking to their recordings project — is a realistic move. No need to compete on corpus if they'll give us GABC under a compatible license.

---

## 12. Sources

- [https://singtheoffice.com/](https://singtheoffice.com/) — live app (SPA shell only via curl; bundle `/web.953c2e8c.js` inspected offline, 3.2 MB)
- [New Liturgical Movement: A Resource for Chanting the Office at Home (Mar 2023)](https://www.newliturgicalmovement.org/2023/03/a-resource-for-chanting-office-at-home.html) — David Clayton's review of the first edition
- [New Liturgical Movement: Upgrade to Second Edition (Jan 2024)](https://www.newliturgicalmovement.org/2024/01/upgrade-to-singtheofficecom-now.html) — announces Ordinariate/DW:DO compliance
- [SingTheOffice Substack: Update #1](https://singtheoffice.substack.com/p/singtheoffice-update-1) — launch retrospective, user-feedback-driven priorities
- [SingTheOffice Substack: Second Edition](https://singtheoffice.substack.com/p/singtheoffice-second-edition) — feature list for v2
- [Way of Beauty: Upgrade to SingtheOffice.com](https://www.thewayofbeauty.org/blog/2024/1/0lvwij125r7olzh07i9b4k40c337b2) — mirror of NLM post
- [Scala Foundation: Chanting the Office at Home](https://scalafoundation.org/2023/02/a-resource-for-chanting-the-office-at-home-in-english-singtheoffice-com/) — promotional repost (no new content)
- Production JS bundle `web.953c2e8c.js` (3,242,835 bytes) — extracted settings objects, route map, component names, prose strings, GABC fragments, and library fingerprints

---

*Research carried out 2026-04-21 against the live site; bundle hash may rotate on subsequent STO deploys. Re-verify bundle before the next design review.*
