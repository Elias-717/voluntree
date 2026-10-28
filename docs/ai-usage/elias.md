# AI Usage Log — Elias

| Date | Tool | Model | Purpose | Prompt (summary) | Output used for |
|---|---|---|---|---|---|
| 2026-10-28 | Claude Code (VS Code) | Claude Opus 5.5 | Coding assistant | "Pull main, read AGENTS.md and docs/team/ELIAS.md, then start Task 0" | Next.js scaffold, dependency install, vitest config, `src/types/domain.ts`, env templates, AI usage log files |
| 2026-10-28 | Claude (claude.ai, with repo tools) | Claude Opus 5.5 | Requirements assistant | "Q&A me on the advisor's requirement changes (school, CGPA, dean approval), then change them in the SRS, PRD and all connected places including the plan in the repo" | DEC-015 to DEC-019; edits to SRS, PRD, `AGENTS.md`, team files, `src/types/domain.ts` |
| 2026-10-28 | Claude Code (VS Code) | Claude Opus 5.5 | Coding assistant | "merge pr #3"; "khathera pushed task 1 and task 2. can you check"; merge #2 and #4; "do the still to do. also the certificates should only be with english" | Merged PRs #2, #3, #4 (resolved the `khathera.md` log conflict); review and test run of the tree and certificate modules; DEC-023; `AGENTS.md` status update |
| 2026-10-28 | Claude Code (VS Code) + Supabase connector | Claude Opus 5.5 | Coding assistant | "create the database, and start phase 2 ... wireframes"; approved the Phase 1 table list, remote project with vitest tests, Figma wireframes, and logging the design step | Phase 1 migrations, RLS and functions applied to the Supabase project; demo seed; database tests; DEC-024, DEC-025 |
