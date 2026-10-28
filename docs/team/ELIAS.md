# Elias — Assignment

Claude: if you are working with Elias, this is his task list. Read `AGENTS.md` first, then follow this file.
Everything in `AGENTS.md` applies. Where this file is more specific, this file wins.

## Role

Owner and lead. Elias makes all project-wide decisions, answers the open questions in `AGENTS.md` §6, and merges every pull request into `main`.

## Folders he owns

Everything not owned by Khathera, including:

- `supabase/`, `src/app/`, `src/lib/db/`, `src/lib/intake/`, `src/types/`
- `package.json`, the lockfile and all config files
- `AGENTS.md`, `CLAUDE.md`, `docs/` (except `docs/ai-usage/khathera.md`)

Khathera owns `public/tree/`, `src/lib/tree/`, `src/lib/certificate/`, `src/lib/matching/` and `scripts/evaluate/`. Do not edit them; ask Khathera through Elias.

## Git routine

1. At the start of every session, pull `main`.
2. Create one branch per task, named `elias/<task>`.
3. Commit only when Elias asks. Messages start with the FR ID.
4. Merge pull requests into `main` only when Elias asks.
5. When merging Khathera's pull requests, copy any decision-log entry she proposed into `docs/DECISION_LOG.md`.

## Tasks, in order

### Task 0 — Phase 0 setup (do first; it unblocks Khathera)

1. Scaffold Next.js with TypeScript and Tailwind.
2. Install every known dependency at once, so `package.json` never conflicts later: Supabase client, zod, the Gemini SDK, pdf-lib, vitest. Confirm the exact packages with Elias first.
3. Add the vitest config.
4. Write `src/types/domain.ts`: the shared types matching needs (student, mission, commitment, recommendation, factor, exclusion). Agree the fields with Elias. Khathera builds against this file.
5. Create `docs/ai-usage/elias.md` and `docs/ai-usage/khathera.md` with headers only.
6. Push to `main`, connect Vercel, and set the environment variables.

**Done when:** a blank app runs on an HTTPS Vercel URL, and `domain.ts` is on `main`.

### Task 1 — Phase 1 data foundation

Follow the phase plan in `AGENTS.md` §5: tables, RLS, the functions `accept_mission`, `approve_completion`, `revoke_completion` and `record_dean_decision`, seed data, and database tests. Includes student school and CGPA, mission eligibility criteria and dean approval (FR-028 to FR-030, DEC-015 to DEC-017).

### Task 2 — Phase 2 core journey without AI

Agree the screen list with Elias first. It must include school and CGPA at registration, the admin mission form with eligibility criteria, and the admin dean-approval queue (FR-028 to FR-030). Then build the screens and server actions, using placeholders where Khathera's modules are not merged yet.

### Task 3 — Phase 4 LLM intake (FR-023)

Gemini server route, Zod validation, the AI-generated label, flagged blanks, AiUsageLog, and the manual form as a fallback.

### Task 4 — Integrate Khathera's modules

As each of her pull requests merges, wire it in:

- tree → student page
- certificate → approval flow
- matching → recommendations screen (DEC-036):
  - Build `Student.commitments` from **every** `mission_assignments` row for the student (all three statuses), using the mission's `starts_at`/`ends_at` as `window`.
  - Build `Student.availability` from `student_profiles.availability` (`[]` means unknown).
  - Build `Student.recentOpportunities` from all of the student's approved participations, all time.
  - Pass only PUBLISHED, upcoming missions. Matching has no clock.
  - When a recommendation has `availability: "UNKNOWN"`, ask the student to confirm they're free for the whole mission before calling `accept_mission`. Don't add an availability check to `accept_mission`. It keeps enforcing eligibility, duplicate assignment, overlap and capacity.
  - Show "Dean approval required" from `mission.deanApprovalRequired`. It isn't part of the score or the factors.
  - Suggestion, for CGPA privacy (BR-15, FR-028): on organizer screens, show `SCHOOL_NOT_ELIGIBLE` and `CGPA_BELOW_MINIMUM` as one label, "Not eligible for this mission". Matching never outputs a CGPA value.
- evaluation → README and baseline page

### Task 5 — Phase 6 ship

Final deploy, README, fallback video, AI usage logs, declaration form, and the real evidence inserted.
