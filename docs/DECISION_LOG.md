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

### DEC-015 — Student school and CGPA
- Date: 2026-10-28
- Change: none → new FR-028 [M]: students declare their school (SBSS, SEHS, SCI, CFGS or LC) and an optional current CGPA (0.00 to 4.00) at registration. CGPA is editable any time; every change is audited with the old and new value. CGPA is self-declared, visible only to the student and admins; organizers see only whether a student meets criteria. StudentProfile gains school and cgpa; AuditEvent gains details.
- Affects: SRS §4, FR-028, §7 StudentProfile and AuditEvent, §12, §13. PRD §4, §5, §6, §7. `src/types/domain.ts` (School, Student.school, Student.cgpa).
- Reason: Advisor meeting: schools need volunteers from their own students, sometimes above a CGPA threshold.
- Decided by: Elias
- Supersedes: none

### DEC-016 — Admin-set mission eligibility criteria
- Date: 2026-10-28
- Change: missions open to all → an admin may set eligible schools (any of; none means all) and a minimum CGPA on any mission. Organizers cannot set criteria; their missions stay open to all. A student without a declared CGPA fails a CGPA threshold. Ineligible students never see a gated mission and the server rejects their acceptance. New FR-029 [M], BR-14. Admins and organizers both create missions.
- Affects: SRS §1.2, §4, FR-004, FR-006, FR-007, FR-029, BR-14, §7 Mission, §10 Stage 1, §12, §13, §14 steps 4 and seed. PRD §1, §2.2, §4, §5, §6, §7, §9.2, §13. `src/types/domain.ts` (Mission criteria fields, exclusion reasons). `docs/team/KHATHERA.md` Task 3.
- Reason: Advisor meeting: different schools need different volunteers.
- Decided by: Elias
- Supersedes: none

### DEC-017 — Optional dean approval of participation
- Date: 2026-10-28
- Change: none → an admin may tick "dean approval required" on a mission. A student's acceptance then enters PENDING_DEAN_APPROVAL and holds a slot; the admin records the dean's decision on the dean's behalf (ACCEPTED or DEAN_REJECTED, which frees the slot). No dean role is added. New FR-030 [M], BR-16; MissionAssignment gains dean_decided_by and dean_decided_at.
- Affects: SRS §3, §4, FR-006, FR-030, BR-16, §7 MissionAssignment, §8 Assignment, §12, §13, §14 step 5. PRD §4, §5, §6, §7, §9.2. `src/types/domain.ts` (Mission.deanApprovalRequired, acceptedCount comment).
- Reason: Advisor meeting: some schools need the dean's sign-off on volunteers.
- Decided by: Elias
- Supersedes: none

### DEC-018 — CGPA reconciled with responsible AI and fairness
- Date: 2026-10-28
- Change: "the matching algorithm never uses grades" → CGPA is used only as an admin-set hard eligibility filter before ranking, never as a score factor, never inferred, never shown to organizers or other students (new BR-15). Fairness balancing and the cold-start rule apply within the eligible pool. Consent screen states that school and CGPA are used only for eligibility and that some opportunities are restricted. The evaluation reports spread within eligible pools and the share of gated missions.
- Affects: SRS FR-007, FR-025, FR-026, BR-15, §9, §10, NFR-09, §17. PRD §3 G-04, §8, §11. `docs/team/KHATHERA.md` Tasks 3 and 4.
- Reason: Without this, the CGPA requirement contradicts SRS §9 and the fairness pitch (FR-024).
- Decided by: Elias
- Supersedes: none

### DEC-019 — Plan updated for DEC-015 to DEC-018; Phase 0 complete
- Date: 2026-10-28
- Change: Phases 1, 2, 3 and 5 extended with FR-028 to FR-030 (columns, RLS, `record_dean_decision`, eligibility in `accept_mission`, registration fields, admin criteria form, dean-approval queue, eligibility filters, within-pool evaluation). All in the Oct 29 build. Phase 0 marked complete. Open questions 11 to 13 added.
- Affects: `AGENTS.md` §3, §5, §6, §7. `docs/team/ELIAS.md` Tasks 1 and 2. SRS §15 Oct 28 row. PRD §10 Oct 28 row.
- Reason: Keep the plan in line with the new requirements.
- Decided by: Elias
- Supersedes: none

### DEC-020 — Eligibility checked at acceptance; dean note optional; CGPA range confirmed
- Date: 2026-10-28
- Change: (1) Open question on CGPA or criteria changing after acceptance → eligibility is checked only when a student accepts; later CGPA changes keep existing assignments; an admin cannot change a mission's criteria once any student has accepted it. (2) Dean decision → recorded with an optional note; MissionAssignment gains dean_note. (3) CGPA range 0.00 to 4.00 confirmed. AGENTS.md open questions 11 to 13 resolved; new question 11 on school edits.
- Affects: SRS FR-029, FR-030, BR-14, §7 MissionAssignment, §12. PRD §7. `AGENTS.md` §3, §5 Phase 1 exit check, §6, §7.
- Reason: Lowest-risk option for the Oct 29 build; adds no new assignment state. Gaming via CGPA edits is visible in the audit log and caught by dean approval where required.
- Decided by: Elias
- Supersedes: none

### DEC-021 — Revoked certificates and demo seed history
- Date: 2026-10-28
- Change: (1) Open question 3 → when an approval is revoked, its certificate record is kept, marked revoked and linked to the revocation entry; download is rejected and the student sees it as revoked. A later re-approval of the same participation reactivates the same certificate and serial. Certificate gains status and revocation_entry_id. (2) Open question 4 → seed students with varied past participation (e.g. 0, 0, 1, 2, 4, 6, 9, 11) as real completed missions with ledger entries and certificates; the demo student starts at 2 waterings so step 6 grows the tree to sprout. Demo step 6 includes switching to that student's login (BR-13).
- Affects: SRS FR-010, §7 Certificate, §12, §13, §14 seed and step 6. PRD §7. `AGENTS.md` §3, §5 Phase 1, §6 Q3 and Q4, §7.
- Reason: (1) Keeps revocation meaningful without breaking the append-only audit (NFR-07) or the one-certificate-per-participation rule (FR-010, BR-07). (2) Makes tree growth visible in the demo and gives the opportunity-balance factor (FR-024) real variation to show.
- Decided by: Elias
- Supersedes: none

### DEC-022 — Students can change their school
- Date: 2026-10-28
- Change: school fixed at registration (unspecified) → students can change their school any time, like CGPA; every change is audited with the old and new value. Existing assignments are kept (DEC-020).
- Affects: SRS FR-028, FR-029, §7 StudentProfile, §12, §13. PRD §6 Identity row. `AGENTS.md` §3, §6 Q11, §7.
- Reason: Students move from CFGS or LC into a degree school.
- Decided by: Elias
- Supersedes: none

### DEC-023 — Certificates in English only
- Date: 2026-10-28
- Change: certificate text language unspecified → certificates are English only. The generator uses the standard PDF fonts (Latin characters; Western European accents such as é and ü also print). Names or titles in other scripts, such as Arabic, are rejected with an error. No `@pdf-lib/fontkit` and no embedded font file. Control characters (tabs, line breaks) in certificate fields are rejected, not converted to spaces.
- Affects: SRS FR-010. `src/lib/certificate/` (as merged in PR #4). `AGENTS.md` §3.
- Reason: Keeps the certificate module dependency-free for the Oct 29 build; AIU coursework and demo data are in English.
- Decided by: Elias
- Supersedes: none

### DEC-024 — Design step added to Phase 2
- Date: 2026-10-28
- Change: Phase 2 started with "Screen list agreed with the owner first", then building → Phase 2 runs in four steps, each approved by Elias before the next: (1) screen list, (2) low-fidelity wireframes in Figma, (3) workflow and UI/UX design (user flows and visual design) in Figma, (4) build the screens from the approved design. Steps 1 to 3 are design work and may run alongside Phase 1; building starts only after the Phase 1 exit check.
- Affects: `AGENTS.md` §5 Phase 2. SRS §15 role "frontend and UX".
- Reason: The plan had no UI/UX step and no wireframes; the screens are what the judges see in the demo.
- Decided by: Elias
- Supersedes: none

### DEC-025 — Phase 1 data model details
- Date: 2026-10-28
- Change: SRS §7 implemented as 9 tables in `supabase/migrations/`, with these details: (1) `recommendations` and `override_logs` are created in Phase 3, `ai_usage_logs` in Phase 4, `notifications` only with FR-012; (2) certificate PDFs are not stored: the PDF is rebuilt from the certificate row on download, so Certificate has no pdf_path; (3) Completion status is APPROVED, REJECTED or REVOKED, and its reviewer column is `reviewed_by`, since it also records rejections; (4) assignment states for the Oct 29 build are PENDING_DEAN_APPROVAL, ACCEPTED and DEAN_REJECTED, with attendance approval held in completions; (5) added functions `reject_completion` (FR-008) and `get_certificate_for_download` (FR-010 download check); (6) `accept_mission` rejects a mission that overlaps one the student already holds (SRS §12); (7) demo logins share one password kept only in `.env.local` as DEMO_PASSWORD, because the repository is public; (8) database tests run with vitest against the Supabase project, using separate test logins and a test organization.
- Affects: SRS §7, §8, §12, §13, FR-008, FR-010. `AGENTS.md` §5 Phase 1, §7.
- Reason: Smallest schema that meets the Phase 1 exit check; keeps PDFs reproducible from data and keeps secrets out of the public repo.
- Decided by: Elias
- Supersedes: none
