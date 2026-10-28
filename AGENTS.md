# AGENTS.md — Voluntree

Read this file at the start of every session, before doing anything else.
It holds the working rules, the project direction, the phase plan and the current status.

Owner: Elias

---

## 0. Start here: who are you working with?

Two people work on this repo, each with their own Claude Code session.

| Person | Role | Assignment file |
|---|---|---|
| Elias | Owner and lead. Makes project-wide decisions and merges pull requests | `docs/team/ELIAS.md` |
| Khathera | Developer. Owns the tree, certificate, matching and evaluation modules | `docs/team/KHATHERA.md` |

At the start of every session:

1. If the person has not said who they are, ask: "Am I working with Elias or Khathera?"
2. Read that person's assignment file before anything else. It lists their folders, their tasks in order, and what they must not edit.
3. Follow the rules below. In them, "the owner" means the person you are working with for decisions inside their own folders, and Elias for anything shared or project-wide.

**Rules to avoid merge conflicts:**

- Edit only the folders the person owns.
- Only Elias's sessions edit `src/types/domain.ts`, `package.json`, the lockfile, config files, `AGENTS.md`, `CLAUDE.md`, `docs/DECISION_LOG.md`, `docs/SRS.md`, `docs/PRD.md` and `docs/team/`.
- Khathera's sessions request changes to those files through her. They never edit them.
- Each person works on their own branches and opens pull requests into `main`. Elias merges.

---

## 1. Working rules

The owner makes the decisions. Your job is to propose, ask, and then build exactly what was approved.

1. **Do not engineer on your own.** Never decide scope, requirements, schema, dependencies, file structure, naming or UX by yourself. Offer two or three options with a recommendation, then wait for the owner's choice.
2. **Ask before you:**
   - add, remove or upgrade a dependency
   - create or change a table, column, index, RLS policy, Postgres function or seed data
   - create a file or folder the current task did not name
   - change a requirement, business rule, ID or product term
   - refactor, rename or "clean up" anything
   - touch code outside the current task
3. **Before each task:** state the task in one line, cite the FR/BR IDs it implements, list the files you will touch, and ask "Proceed?". Start only after a yes.
4. **During a task:** make the smallest change that satisfies it. If you notice another problem, list it at the end. Do not fix it.
5. **After each task:** report the files changed and how you verified them (tests run, results). Update section 7, "Current status". Propose the next task from the phase plan, but do not start it.
6. **Conflicts:** if a request conflicts with the SRS, PRD or decision log, stop, quote both, and ask which one wins.
7. **Decision log:** every change to scope, requirements, design, data model, plan or pitch that the owner approves gets a new entry in `docs/DECISION_LOG.md`, using the format in that file. Entries are append-only. Code that implements an existing requirement does not need an entry. Only Elias's sessions edit the log; Khathera's sessions propose entries in the pull request description.
8. **AI usage log:** record every AI tool, model and prompt used, including yourself as a coding assistant, in the person's own log: `docs/ai-usage/elias.md` or `docs/ai-usage/khathera.md`. The competition declaration form depends on it.
9. **Evidence:** never invent survey results, quotes, metrics or dates. Leave `[BRACKETS]` placeholders until the owner supplies the real data.
10. **Data:** synthetic data only. No real student data.
11. **Secrets:** never commit keys. Keys live in `.env.local` and Vercel environment variables. The Gemini key and the Supabase service-role key are used only on the server.
12. **Git:** pull `main` at the start of every session. Work on a branch named `<person>/<task>`. Commit only when the person asks. Use small commits whose message starts with the FR ID, e.g. `FR-009: idempotent watering on approval`. Never force-push.
13. **Explainability:** keep the code simple enough for every team member to explain in the judges' Q&A. No clever abstractions.

## 2. Source of truth

Precedence, highest first:

1. The owner's latest instruction
2. `docs/DECISION_LOG.md` (later entries override the SRS and PRD)
3. `docs/SRS.md` (SRS v1.1, Markdown copy)
4. `docs/PRD.md` (PRD v1.1, Markdown copy)

## 3. Project snapshot

Voluntree helps AIU fill event volunteer slots fairly. AI drafts missions from announcements and recommends students with a transparent score that boosts those with fewer past opportunities. Each approved participation earns a certificate and waters the student's private tree, which grows every 3 waterings.

- **Competition:** MMC Upstart 2026 Catalyst, Focus Area 02 (Smart Campus and Institutional Systems).
- **Dates (unconfirmed, verify with the organizers):** Oct 29 submission, Nov 2 internal pitch, Nov 5 final.
- **Core journey (must run live end to end):**
  1. The student sees the consent screen.
  2. The organizer pastes an announcement, the LLM drafts a mission, and the organizer edits and publishes it.
  3. Matching recommends students with "Why recommended".
  4. Students accept, with capacity enforced.
  5. The organizer approves attendance, which adds one watering, grows the tree and issues a PDF certificate.
  6. Repeating the approval changes nothing.
  7. The baseline comparison is shown.

**Decisions in force (see the decision log for details):**

- The product is named Voluntree. The Granny persona is removed.
- There are no XP, points, levels or leaderboard. FR-013 is deleted.
- One organizer-approved participation adds one watering, recorded exactly once in the append-only WateringLedger.
- Tree stages are seed 0, sprout 3, sapling 6, young tree 9 and full tree 12. The step of 3 is configurable. The tree stays full after 12.
- No hours anywhere. Organizers approve attendance only, and certificates show name, mission, date and ID.
- Certificates are English only (standard PDF fonts, Latin characters). Text in other scripts, such as Arabic, is rejected (DEC-023).
- An admin may revoke an approval with a logged reason. This is the only case where a tree shrinks. The certificate is then marked revoked and can't be downloaded; re-approval reactivates the same certificate (FR-010).
- Demo seed: students have varied past participation, seeded as real completed missions; the demo student starts at 2 waterings so the tree grows to sprout in demo step 6.
- A student's tree is visible only to that student (BR-13).
- AI is advisory. The LLM drafts missions only. Overrides need a logged reason (BR-11).
- Students declare their school (SBSS, SEHS, SCI, CFGS or LC) and an optional CGPA at registration. School and CGPA are editable any time (e.g. moving from CFGS or LC into a degree school), every change is audited, and only the student and admins see it (FR-028).
- Only admins set eligibility criteria on a mission: eligible schools, a minimum CGPA, and dean approval. Missions without criteria are open to all. Ineligible students never see a gated mission (FR-029, BR-14).
- CGPA is a hard eligibility filter only, never a score factor. Fairness balancing applies within the eligible pool (BR-15).
- Dean approval gates each student's participation. A pending request holds a slot; the admin records the dean's decision with an optional note. There is no dean role (FR-030, BR-16).
- Eligibility is checked only at acceptance. Later school or CGPA changes keep existing assignments; criteria are locked once any student has accepted (FR-029, BR-14).
- Matching ranks only published missions. Hard filters for recommendations: an existing assignment for the same mission (any status), a time conflict with a pending or accepted assignment, declared availability that does not cover the whole mission (empty availability counts as unknown and is not excluded), school, minimum CGPA, opt-out, a full mission. Skills only affect the score; availability, CGPA and dean approval never do. Score weights: skill 50%, opportunity balance 28.6%, proximity 14.3%, reliability 7.1%. Opportunity balance counts all approved participations, all time. Students with unknown availability confirm before accepting; accept_mission does not check availability. A dean rejection is final for that mission (DEC-036).

## 4. Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, PWA manifest |
| Backend | Next.js server routes or server actions |
| Database and auth | Supabase: PostgreSQL, Auth with demo accounts, row-level security |
| Capacity and idempotency | Postgres functions with `SELECT … FOR UPDATE`; unique idempotency key on the watering ledger |
| LLM intake | Google Gemini API, server-side only, output validated with a Zod schema |
| Matching and evaluation | TypeScript |
| Certificates | pdf-lib, server-side |
| Tree | 5 SVG stages, stage derived from the watering count |
| Live updates | Polling every few seconds (allowed by FR-011 for the Oct 29 build) |
| Tests | Vitest |
| Hosting | Vercel (HTTPS), GitHub |

## 5. Phase plan

Finish each phase's exit check before starting the next. If time runs out, cut stretch items first. Never cut the end-to-end journey.

| Phase | Scope | IDs | Exit check |
|---|---|---|---|
| 0. Setup | Scaffold Next.js; install all known dependencies; vitest config; `src/types/domain.ts`; link Supabase and Vercel; env vars; empty files in `docs/ai-usage/` | NFR-10 | Blank app deployed on an HTTPS Vercel URL; `domain.ts` on `main` |
| 1. Data foundation | Tables from SRS §7 as amended by the log, including student school and CGPA, mission eligibility criteria and dean-decision fields; RLS (CGPA readable by the student and admins only); functions `accept_mission` (eligibility check, pending state when dean approval is required), `approve_completion`, `revoke_completion`, `record_dean_decision`; seed of 8 students (mixed schools and CGPAs, one with none; varied past participation as real completed missions, demo student at 2 waterings), 1 organizer and 1 admin | FR-001, FR-002, FR-006, FR-008, FR-009, FR-028–FR-030, BR-01–BR-16 | DB tests pass: capacity never exceeded under concurrency (pending dean approvals count), double approval gives one watering and one certificate, revocation without a reason is rejected, ineligible acceptance rejected, organizer cannot set criteria or read CGPA, dean rejection frees the slot, criteria edit after the first acceptance rejected, revoked certificate download rejected, re-approval reactivates the same certificate |
| 2. Core journey, no AI | Design first, each step approved by Elias (DEC-024): screen list, then low-fidelity wireframes in Figma, then the workflow and UI/UX design in Figma. Then build: public landing page and one-tap demo sign-in (DEC-026), school and CGPA at registration, manual mission form (admin version with eligibility criteria), publish, accept, admin dean-approval queue, admin overview with counters and fairness chart (DEC-027), approve attendance, tree, PDF certificate, polling updates, consent screen. Students mobile-first; organizer and admin desktop-first | FR-001, FR-004, FR-005, FR-006, FR-008, FR-010, FR-011, FR-015 (part), FR-025, FR-027, FR-028–FR-030 | The whole journey works by hand on the deployed URL, including one gated mission with dean approval |
| 3. Matching and fairness | Hard filters (including school and minimum CGPA), transparent score, exposure balancing, cold-start rule, "Why recommended", override with a logged reason | FR-007, FR-024, FR-029, BR-11, BR-15 | Seeded fixtures give deterministic rankings; conflicting, already-assigned, unavailable and ineligible (school or CGPA) students are excluded; empty availability is not excluded; non-published missions are never matched; CGPA does not change any score |
| 4. LLM intake | Gemini server route, schema validation, AI-generated label, blanks flagged, AiUsageLog, manual form as fallback | FR-023 | Paste, draft, edit, publish works; nothing is published automatically |
| 5. Evaluation | Baseline script comparing against first-come-first-served on seeded data; spread within eligible pools and share of gated missions; trade-offs reported honestly | FR-026 | Results reproducible from the README |
| 6. Ship | Final deploy, README, fallback video, AI usage log complete, declaration form, evidence inserted | NFR-10 | Submission checklist in SRS §17 complete |
| 7. Stretch | Only after every Must passes. The owner picks the items | FR-003, FR-012, FR-014–FR-016 | Owner's call |

## 6. Open questions

Ask the owner about these when they become relevant. Do not decide them yourself.

1. Team: Elias and Khathera so far. Are more members joining, and does everyone meet the final-year eligibility rule (SRS §15)?
2. Official competition dates.
3. Resolved (DEC-021): a revoked approval marks its certificate revoked.
4. Resolved (DEC-021): varied seeded history; the demo student starts at 2 waterings.
5. How real students enter skills and availability. FR-007 is a Must but needs them, while FR-003 Student Profile is only a Should. Until this is resolved, empty availability counts as unknown (DEC-036).
6. Override UI: BR-11 and demo step 4 need it, but the PRD lists the override log UI as Stretch.
7. Demo step 6 mentions a notification, but FR-012 In-App Notifications is only a Should.
8. Gemini data handling: strip personal details before sending? Which tier and terms?
9. Is the organizer a primary or a secondary user? The SRS and PRD disagree.
10. The SRS header says "2-week build", while the plan says 2 days.
11. Resolved (DEC-022): students can change their school any time, audited like CGPA.

## 7. Current status

Update this section after every completed task.

- **Phase:** 1 done (exit check met 2026-10-28: 10 database tests pass); Phase 2 design (DEC-024) next
- **Done:** requirements finalized (SRS and PRD v1.1, decisions DEC-000 to DEC-025; DEC-015 to DEC-020 add student school and CGPA, admin eligibility criteria and dean approval after the advisor meeting; DEC-023 makes certificates English only; DEC-024 adds the Phase 2 design step; DEC-025 records the Phase 1 data model details); `AGENTS.md`, `CLAUDE.md`, `docs/` and the team assignment files pushed to `Elias-717/voluntree`. Task 0 merged to `main` (PR #1) and deployed at <https://voluntree-nine.vercel.app> (Vercel project `elias-school/voluntree`, Framework Preset: Next.js, env vars set): Next.js 16.4.3 scaffold (TypeScript, Tailwind, ESLint, App Router, `src/`), dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `@google/genai`, `pdf-lib`; dev: `vitest`, `supabase` CLI, `@types/node` ^22), `vitest.config.ts`, `src/types/domain.ts`, `.env.example`, empty `docs/ai-usage/` logs. Supabase project `voluntree` (`aukdxiljmwqdfrwsayqk`) linked in `.env.local`. Khathera Task 1 merged (PR #2): 5 tree SVGs in `public/tree/` and `getTreeStage` in `src/lib/tree/` (14 tests). Khathera Task 2 merged (PR #4): `generateCertificatePdf` in `src/lib/certificate/` (37 tests). Both function names and inputs are now fixed for the screens. Phase 1 on branch `elias/phase-1-data`, applied to the Supabase project: 4 migrations in `supabase/migrations/` (9 tables, row-level security, functions `accept_mission`, `approve_completion`, `reject_completion`, `revoke_completion`, `record_dean_decision`, `get_certificate_for_download`), demo seed (`supabase/seed-users.mjs`, then `supabase/seed.sql`; password in `.env.local` as DEMO_PASSWORD), and `supabase/tests/phase1.test.ts` (10 tests passing against the live project). DEC-036 matching shared changes merged (PR #6). Khathera Task 3 (matching) merged (PR #8): `matchStudentsToMission` and `recommendMissionsForStudent` in `src/lib/matching/` (87 tests)
- **Phase 2 design:** screen list and low-fidelity wireframes approved 2026-10-28 (21 screens, DEC-026 to DEC-029; students playful and minimal): Figma file "Voluntree — Phase 2 Wireframes", page "Wireframes — final" (<https://www.figma.com/design/Qae9YYkLMZoEW7AZBM9Xf9?node-id=16-2>)
- **Next:** Elias: Phase 2 step 3, the workflow and UI/UX design in Figma (pick a style direction first); then build. Khathera: Task 4 (baseline evaluation)
- **Blockers:** none

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
