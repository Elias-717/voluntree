# Voluntree (formerly Granny's Guild) — Decision Log

Baseline: SRS v1.1 and PRD v1.1 (Competition Edition), dated 27 October 2026.

Rules:
- Every change to scope, requirements, design, data, plan or pitch gets one entry.
- Entries are append-only. A reversed or revised decision gets a new entry that names the one it supersedes.
- "Affects" uses stable IDs (FR-xxx, BR-xx, NFR-xx, SRS §n, PRD §n) so changes stay traceable.

## Entry format

```
### DEC-NNN — <short title>
- Date: YYYY-MM-DD
- Change: <before> → <after>
- Affects: <documents, sections, requirement IDs>
- Reason: <why>
- Decided by: <name>
- Supersedes: <DEC-NNN or none>
```

## Entries

### DEC-000 — Baseline established
- Date: 2026-10-27
- Change: Log started against SRS v1.1 and PRD v1.1.
- Affects: All
- Reason: Starting reference point for all later changes.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-001 — Product renamed to Voluntree
- Date: 2026-10-28
- Change: Product name "Granny's Guild" → "Voluntree".
- Affects: SRS title and every name reference. PRD not yet updated.
- Reason: New identity: a tree that grows as the student volunteers.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-002 — Granny guide persona removed
- Date: 2026-10-28
- Change: FR-018 [S] Granny Guide Persona and all Granny persona references → removed.
- Affects: SRS FR-018, §5.3.
- Reason: The persona does not fit the Voluntree identity; the tree replaces it.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-003 — Growing tree added as a minimal Must-have
- Date: 2026-10-28
- Change: none → FR-027 [M] Growing Tree: each student's tree shows a growth stage chosen from a small fixed set by lifetime approved XP; it grows on screen when an approval lands and never shrinks (consistent with BR-03, BR-08).
- Affects: SRS §5.1 (new FR-027), §14 demo minute 6 to 7.
- Reason: Makes the Voluntree identity visible in the demo at low build cost.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-004 — PRD aligned with DEC-001 to DEC-003
- Date: 2026-10-28
- Change: PRD still used "Granny's Guild" and the Granny persona → renamed to Voluntree; Granny journey note (§5) and Granny humor policy (§7) removed; tree added to §1 innovation note, §5 step 5, §6 MVP "XP and certificates" row, and §7 as "The tree only grows. It never shrinks or penalizes a student."
- Affects: PRD title and metadata, §1, §5, §6, §7.
- Reason: Keep the PRD consistent with the SRS.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-005 — XP replaced by waterings
- Date: 2026-10-28
- Change: XP points → waterings. One watering per organizer-approved participation, recorded once in an append-only ledger. Mission "XP value" field removed; every mission is worth one watering. XpLedger → WateringLedger.
- Affects: SRS §2 journey, §3 permissions, FR-004, FR-008, FR-009 (renamed Watering Record), FR-011, BR-01, BR-05, BR-07, BR-08, §7 Mission and WateringLedger, §9, NFR-06, §12 test table, §14 demo steps 6 and 7, §15 plan. PRD §1, §3 goals, §5, §6, §7, §8, metrics, plan.
- Reason: XP reads as gamified; watering fits the tree metaphor.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-006 — Tree stages fixed
- Date: 2026-10-28
- Change: "small fixed set of stages by lifetime approved XP" → five stages every 3 waterings: seed 0, sprout 3, sapling 6, young tree 9, full tree 12. Step of 3 is a configuration value. After 12 the tree stays full while waterings keep counting.
- Affects: SRS FR-027. PRD §6 MVP row.
- Reason: Simple, explainable growth rule.
- Decided by: Mohammed Khaled Abdo
- Supersedes: DEC-003 (stage rule only)

### DEC-007 — FR-013 levels and leaderboard deleted
- Date: 2026-10-28
- Change: FR-013 [S] XP Levels and Opt-In Leaderboard → deleted. BR-10 (leaderboard opt-in) deleted. Room table note and PRD "room affiliation" question removed, since rooms existed only for the leaderboard.
- Affects: SRS FR-013, BR-10, §7 note. PRD §6 Stretch cell (now "None"), §7, open questions.
- Reason: Removes the competitive element; the tree is the only progress view.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-008 — Hours removed everywhere
- Date: 2026-10-28
- Change: Verified hours → removed. Organizers approve attendance only; certificates show name, mission, date and ID; counters show approved participations. BR-06 (certificate hours) deleted; Completion.approved_hours removed.
- Affects: SRS §1.1, §1.2, §1.3 metric, FR-008, FR-010, FR-014, BR-06, §7 Completion, §11 API review endpoint. PRD §1, §2 users table, §4 roles, §5, §6 dashboards, open questions.
- Reason: Growth and recognition count participation, not time.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-009 — Admin revocation of approvals
- Date: 2026-10-28
- Change: none → an admin may revoke a mistaken or fraudulent approval by adding a revocation ledger entry with a logged reason; this is the only case the tree shrinks. New endpoint POST /completions/:id/revoke (Admin).
- Affects: SRS §3 permissions, FR-009, FR-027, BR-03, §7 WateringLedger, §11 API. PRD §6 MVP row, §7.
- Reason: Keeps the record correctable without editing history.
- Decided by: Mohammed Khaled Abdo
- Supersedes: DEC-003 ("never shrinks" only)

### DEC-010 — Reward threshold clause deleted
- Date: 2026-10-28
- Change: "Any future reward unlocks at an XP threshold" → deleted. Rewards stay Future (FR-017) with no threshold defined.
- Affects: SRS BR-03. PRD §7.
- Reason: No reward mechanic is tied to waterings.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-011 — Tree visible only to its student
- Date: 2026-10-28
- Change: none → new BR-13: a student's tree is visible only to that student.
- Affects: SRS BR-13, FR-027. PRD §7.
- Reason: Privacy and no comparison between students.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-012 — Team split and conflict rules
- Date: 2026-10-28
- Change: single-owner workflow → two-person team. Mohammed Khaled Abdo is owner and lead. Khathera owns `public/tree/`, `src/lib/tree/`, `src/lib/certificate/`, `src/lib/matching/` and `scripts/evaluate/`. Mohammed owns everything else, including shared types, dependencies, config, `AGENTS.md` and the decision log. One branch per person and task, pull requests into `main`, Mohammed merges. The AI usage log is split per person into `docs/ai-usage/`. Each person has an assignment file in `docs/team/`.
- Affects: `AGENTS.md` §0, rules 7, 8 and 12, §5 Phase 0, §6 Q1, §7. New `docs/team/MOHAMMED.md` and `docs/team/KHATHERA.md`. SRS §15 (team roles) not yet updated.
- Reason: Parallel work without merge conflicts; each Claude Code session reads its person's tasks first.
- Decided by: Mohammed Khaled Abdo
- Supersedes: none

### DEC-013 — Owner referred to as Elias
- Date: 2026-10-28
- Change: Owner named "Mohammed" / "Mohammed Khaled Abdo" in the working files → "Elias". `docs/team/MOHAMMED.md` → `docs/team/ELIAS.md`; AI usage log `docs/ai-usage/mohammed.md` → `docs/ai-usage/elias.md`; branch prefix `mohammed/` → `elias/`. Earlier log entries keep "Mohammed Khaled Abdo" because the log is append-only; it refers to the same person.
- Affects: `AGENTS.md`, `docs/team/ELIAS.md`, `docs/team/KHATHERA.md`.
- Reason: Owner's preferred name.
- Decided by: Elias
- Supersedes: none

### DEC-014 — Next.js agent-rules block kept in AGENTS.md
- Date: 2026-10-28
- Change: `AGENTS.md` without Next.js notes → `AGENTS.md` ends with the `nextjs-agent-rules` block that `next dev` (Next.js 16) writes. The block is committed once and left as is; nobody edits or removes it.
- Affects: `AGENTS.md` (end of file).
- Reason: `next dev` re-adds the block whenever it is missing, which would leave `AGENTS.md` as an uncommitted change on every branch and cause merge conflicts. With the block committed, `next dev` leaves the file unchanged.
- Decided by: Elias
- Supersedes: none
