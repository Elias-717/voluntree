# Khathera — Assignment

Claude: if you are working with Khathera, this is her task list. Read `AGENTS.md` first, then follow this file.
Everything in `AGENTS.md` applies. Where this file is more specific, this file wins.

## Role

Developer. Khathera owns the self-contained TypeScript modules: the tree, the certificate, matching and the baseline evaluation.
None of them needs the database or any API key, so she can build and test them on her own.

**Decisions:** Khathera decides details inside her own folders. Anything that affects shared files, other folders, requirements or the plan goes to Elias. Ask Khathera, never decide yourself.

## Folders she owns (edit only these)

| Folder | Contents |
|---|---|
| `public/tree/` | The 5 tree stage SVGs |
| `src/lib/tree/` | Tree stage logic and its tests |
| `src/lib/certificate/` | PDF certificate generator and its tests |
| `src/lib/matching/` | Matching engine and its tests |
| `scripts/evaluate/` | Synthetic data generator and baseline evaluation |
| `docs/ai-usage/khathera.md` | Her AI usage log |

Put tests next to the code as `*.test.ts` inside these folders.

## Do not edit (owned by Elias)

Everything else, including `src/types/domain.ts`, `package.json`, the lockfile, config files, `supabase/`, `src/app/`, `AGENTS.md`, `CLAUDE.md`, `docs/DECISION_LOG.md`, `docs/SRS.md`, `docs/PRD.md` and `docs/team/`.

If a task needs a change there (a new dependency, a new shared type, an npm script), write the exact request, stop, and ask Khathera to send it to Elias.

## Git routine

1. At the start of every session, pull `main`.
2. Create one branch per task, named `khathera/<task>`, e.g. `khathera/tree`.
3. Commit only when Khathera asks. Messages start with the FR ID.
4. Open a pull request into `main`. Elias merges it.
5. If the task changes a decision, propose the decision-log entry in the pull request description. Do not edit the log.

## Before starting

Check that Elias's Phase 0 work is on `main`: `package.json` with vitest and pdf-lib, and `src/types/domain.ts`.

- If vitest or pdf-lib is missing, only the SVG part of Task 1 can start. Tell Khathera.
- Task 3 cannot start until `src/types/domain.ts` exists.

## Tasks, in order

### Task 1 — Tree (FR-027, DEC-006)

1. Draw 5 SVGs in `public/tree/`: seed, sprout, sapling, young tree, full tree.
   - All on the same canvas size.
   - Simple flat shapes that read clearly on a phone.
   - No text inside the images.
   - Ask Khathera about colours and style before drawing.
2. In `src/lib/tree/`, write one function that takes the student's watering count and returns the stage, its SVG path, and how many waterings remain until the next stage.
   - The step of 3 is a named constant.
   - Stages start at 0, 3, 6, 9 and 12. After 12 the tree stays full.
3. Tests: 0 → seed, 2 → seed, 3 → sprout, 11 → young tree, 12 → full tree, 40 → full tree.
4. Ask Khathera how to handle invalid input, such as a negative or non-integer count.

**Done when:** tests pass and all 5 SVGs display correctly.

### Task 2 — Certificate PDF (FR-010, BR-12, DEC-008)

1. In `src/lib/certificate/`, write one function that takes the student name, mission title, date and certificate ID, and returns PDF bytes using pdf-lib.
2. The certificate must:
   - show the title "Certificate of Appreciation", the four fields above, and a visible watermark: "Prototype — not an official AIU document" (BR-12)
   - include no hours (DEC-008)
   - include no AIU logo or signature
3. Tests: it returns a valid PDF, and the certificate ID and student name appear in its text.

**Done when:** tests pass and a sample PDF opens correctly.

### Task 3 — Matching (FR-007, FR-024, SRS §10, NFR-09)

Wait for `src/types/domain.ts` and use only its types.

1. **Stage 1, filters.** Match only PUBLISHED missions. Exclude students with an assignment for the same mission in any status (`ALREADY_ASSIGNED`), a time conflict with a PENDING_DEAN_APPROVAL or ACCEPTED assignment on another mission, declared availability that does not cover the whole mission (`NOT_AVAILABLE`; an empty availability list counts as unknown and is not excluded), a school not in `mission.eligibleSchools` (empty means all), a CGPA below `mission.minCgpa` or no CGPA when a minimum is set (FR-029, DEC-016), a matching opt-out (FR-025), or a full mission. Each excluded student carries the reason. Required skills are not a filter; they count only in the skill-alignment score. Dean approval does not affect matching. Each recommendation reports `availability: "FULL" | "UNKNOWN"` (DEC-036).
2. **Stage 2, transparent weighted score.** Starting weights from SRS §10:

   | Factor | Weight |
   |---|---|
   | Skill alignment | 50% (35/70) |
   | Opportunity balance (fewer past participations scores higher) | 28.6% (20/70) |
   | Optional proximity | 14.3% (10/70) |
   | Verified reliability, with a neutral default for new students | 7.1% (5/70) |

   Availability is a Stage 1 filter for recommendations only, never a score factor (DEC-036). `recentOpportunities` counts all approved participations, all time; the API computes it.

   Omitted factors are re-normalized. Keep the weights as named constants in one place.
3. **"Why recommended."** Every recommendation lists each factor and its contribution.
4. **Determinism.** The same input always gives the same order, with a fixed tie-break.
5. **Never use** grades, gender, nationality, religion or any other sensitive attribute in the score (NFR-09). CGPA is used only in the Stage 1 filter, never in Stage 2 (BR-15). Availability is never in Stage 2 either (DEC-036).
6. Tests on fixed fixtures:
   - a conflicting student, an already-assigned student (pending, accepted and dean-rejected) and an opted-out student are excluded
   - a dean-rejected assignment on another mission causes no time conflict
   - availability: full coverage passes (`FULL`); partial coverage is excluded (`NOT_AVAILABLE`); touching windows that together cover the mission pass; a new student with empty availability is recommended as `UNKNOWN`
   - availability (full or unknown) does not change the score
   - a student with none of the required skills is still recommended, with a lower skill score
   - the four weights add up to 1, with and without proximity
   - a non-published mission throws in `matchStudentsToMission` and is skipped in `recommendMissionsForStudent`
   - a student from a non-listed school, a student below the minimum CGPA and a student with no CGPA are excluded from a gated mission; a CGPA equal to the minimum is eligible
   - raising an eligible student's CGPA does not change their score
   - a new student still appears in recommendations
   - the same input gives the same output

**Done when:** all tests pass.

### Task 4 — Baseline evaluation (FR-026)

1. In `scripts/evaluate/`, build:
   - a synthetic data generator with a fixed random seed
   - a first-come-first-served baseline
   - a run of the matching engine on the same data
2. Output the SRS §1.3 metrics for both methods:
   - share of slots filled by skill-matched students
   - spread of opportunities (Gini and max–min gap)
   - time conflicts offered
   - for gated missions, spread within the eligible pool, and the share of missions that are gated (FR-026)
3. Report honestly, including cases where the baseline wins. Synthetic students include a school and a CGPA (some with none).
4. Ask Khathera how large the simulation should be (number of students and missions).
5. Ask Elias, through Khathera, to add an npm script so the results can be reproduced with one command.

**Done when:** one command reproduces the same numbers every time.

### Task 5 — Palm tree stages (FR-027, DEC-051)

The tree becomes a palm across the app. Elias changed the landing page's 3D tree; this task changes the 5 stage images students see (home gauge, My tree, the planted screen, "You grew").

1. Redraw the 5 SVGs in `public/tree/` as a palm's life:
   - `seed.svg`: a date seed in the soil.
   - `sprout.svg`: a single spear leaf coming out of the soil.
   - `sapling.svg`: a young palm with no trunk yet, a tuft of 3 to 4 feather fronds at ground level.
   - `young-tree.svg`: a short ringed trunk with a small crown of fronds.
   - `full-tree.svg`: a tall, slightly curved ringed trunk, a full crown of drooping feather fronds and a few date clusters under the crown.
   - On the young and full palm, cover the trunk with diamond scales in crossing diagonal rows (the cut-off bases of old fronds, as on a real date palm), with sharp edges and a slightly darker groove between them, the same pattern as the landing page palm.
2. Keep the file names, the 200×200 canvas and the soil at the bottom, so `getTreeStage` and its tests don't change. No text in the images. Flat shapes that read on a phone, in the same greens and browns as now.
3. Animate inside each SVG with a `<style>` block (CSS keyframes, no script, so it still works when loaded through `<img>`):
   - fronds sway gently from where they meet the trunk (a few degrees, about 4 to 6 seconds a cycle, each frond a little out of step);
   - the seed and the spear leaf bob or lean slightly;
   - wrap the animation in `@media (prefers-reduced-motion: no-preference)` so it stops when the device asks for reduced motion.
4. The stage names stay Seed, Sprout, Sapling, Young tree and Full tree. (Later renamed Young palm and Date palm on the screens by Elias, DEC-053; stage keys unchanged.) Don't change `src/lib/tree/tree.ts` unless you find a reason; ask first.
5. Check each stage on the student screens on a phone width, in light and dark mode.

**Done when:** the 5 palm SVGs are merged, they sway on the student screens, they stay still with reduced motion on, and the tree tests still pass.

### Task 6 — Evaluation of the live configuration (FR-026, DEC-048, DEC-050, DEC-054)

Evaluate the live configuration (no skills, no declared availability, no reliability data) as the primary result, and keep the original simulation as a hypothetical future configuration. `npm run evaluate` regenerates both.

**Done when:** merged (PR #22).

## Hand-off

Elias's screens import these functions. Do not change a function's name or inputs once its pull request is merged without asking first.

Matching exports `matchStudentsToMission(mission, students): MatchResult` (organizer view) and `recommendMissionsForStudent(student, missions): Recommendation[]` (`GET /missions/recommended`; missions the student is excluded from are hidden).
