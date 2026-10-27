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

1. **Stage 1, filters.** Exclude students with a time conflict, missing required eligibility, a matching opt-out (FR-025), or a full mission. Each excluded student carries the reason.
2. **Stage 2, transparent weighted score.** Starting weights from SRS §10:

   | Factor | Weight |
   |---|---|
   | Skill alignment | 35% |
   | Availability fit | 30% |
   | Opportunity balance (fewer past participations scores higher) | 20% |
   | Optional proximity | 10% |
   | Verified reliability, with a neutral default for new students | 5% |

   Omitted factors are re-normalized. Keep the weights as named constants in one place.
3. **"Why recommended."** Every recommendation lists each factor and its contribution.
4. **Determinism.** The same input always gives the same order, with a fixed tie-break.
5. **Never use** grades, gender, nationality, religion or any other sensitive attribute (NFR-09).
6. Tests on fixed fixtures:
   - a conflicting student, an unqualified student and an opted-out student are excluded
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
3. Report honestly, including cases where the baseline wins.
4. Ask Khathera how large the simulation should be (number of students and missions).
5. Ask Elias, through Khathera, to add an npm script so the results can be reproduced with one command.

**Done when:** one command reproduces the same numbers every time.

## Hand-off

Elias's screens import these functions. Do not change a function's name or inputs once its pull request is merged without asking first.
