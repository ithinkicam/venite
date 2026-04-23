# Baseline Known Issues (pre-chant-Phase-1)

These issues exist on `claude/chant-phase-1` HEAD `26a5ad37` (before any chant work) and are **unrelated** to the chant feature. Downstream worker agents use this list to distinguish pre-existing baseline noise from regressions their own work may introduce.

**Rule:** If your work makes one of these worse (e.g., adds a new failure in these tests, or changes the error), STOP and report. If these specific failures remain in their current form, they are acceptable baseline and not a regression.

## Fixed in baseline-unblock commit

- **`ldf/` build exit code**: was non-zero (TypeScript 3.8 vs `@types/node@20` parse errors). Pinned `@types/node@^14`. Build now exits 0.

## Known-failing `ldf` tests (not fixed; allow-listed for now)

Run `cd ldf && npm test` on a clean checkout and you should see **exactly these 5 failures**, no more, no fewer:

1. `tests/psalm.test.ts` › `Psalm.filteredVerses() › should support -end in psalm citations`
2. `tests/option.test.ts` › `Option.getVersionLabel()` › canticles with multiple versions
3. `tests/option.test.ts` › `Option.getVersionLabel()` › invitatories with multiple versions
4. `tests/bible.test.ts` › `Bible Class abbreviation and name functions` › eucharistic intro compilation
5. `tests/bible.test.ts` › `Bible Class abbreviation and name functions` › office intro compilation

## Known-broken `ldf` test suite

- `tests/find-collect.test.ts` — entire suite fails to load with `TypeError: Class extends value undefined is not a constructor or null` at `src/bible-reading/bible-reading.ts:12`. Circular import. None of this suite's tests run. Tracked as allow-listed; fixing the circular import is out of scope for chant Phase 1.

## What to do with this file going forward

- Phase-2+ refactor work may fix these. When fixed, remove the corresponding line from this doc in the same commit.
- If a chant-Phase-1 worker's acceptance check says "all ldf tests pass" but you see 5 pre-existing failures, that's expected. Look for *new* failures beyond these 5 to decide if your work caused regression.
