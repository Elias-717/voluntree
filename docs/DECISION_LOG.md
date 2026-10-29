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

### DEC-026 — Landing page, desktop-first staff screens, one-tap demo sign-in
- Date: 2026-10-28
- Change: (1) none → a public one-page landing page before sign-in (hero, how it works in 3 steps, fairness and privacy, prototype disclaimer); (2) all screens mobile-first → students stay mobile-first, organizer and admin screens are desktop-first (sidebar, tables) and still usable on a phone; (3) email and password only → the sign-in page also offers one-tap demo sign-in as the seeded student, organizer or admin. The server signs in with DEMO_PASSWORD, which never reaches the browser, and the buttons appear only in demo mode. Not adopted for now: 2-step onboarding, tree "growth moment" with 4 tabs, pre-accept warnings and feedback states.
- Affects: SRS FR-001, §14 demo script. PRD §6. Phase 2 screen list (Figma "Voluntree — Phase 2 Wireframes", page "Wireframes v2").
- Reason: The landing page explains the product to judges in seconds; staff work at desks; one-tap sign-in avoids typing passwords during the live demo.
- Decided by: Elias
- Supersedes: none

### DEC-027 — Small admin overview moved into Phase 2
- Date: 2026-10-28
- Change: FR-015 Admin Dashboard was entirely a Should (Phase 7) → part of it moves into Phase 2: the admin home becomes an "Overview" with 4 counters (missions published, slots filled on open missions, dean approvals waiting, participations approved), a fairness chart of how many students have 0, 1–2, 3–5 and 6+ opportunities (counts only, no names), the share of gated missions, and the last 5 audit events. The full audit browser, filters and exports stay in Phase 7. The organizer home keeps only its counters; FR-014 stays a Should.
- Affects: SRS FR-015, FR-024, FR-026. PRD §6. `AGENTS.md` §5 Phase 2. Figma wireframe screen 15.
- Reason: Makes fairness visible to judges with data the Phase 1 database already holds; aggregates only, so BR-13 and BR-15 are kept.
- Decided by: Elias
- Supersedes: none

### DEC-028 — Playful, minimal student screens; landing page that intrigues
- Date: 2026-10-28
- Change: (1) student screens showed full detail (skills, capacity bars, serials, long notices) → playful and minimal: one idea per screen, big rounded buttons, emoji, short copy, details behind a "More info" link. The consent screen keeps every FR-025 point, one line each. School is picked from big tiles. The tree screen shows water drops instead of numbers. (2) The DEC-026 landing page (hero, how it works, fairness and privacy cards) → one headline ("Show up. Grow something."), one button, and the tree growing seed to full; no explanatory sections. The prototype disclaimer stays. Organizer and admin screens are unchanged.
- Affects: Phase 2 wireframes (Figma "Wireframes — final"), screens 0 and 2–8. SRS FR-025 wording on screen (content unchanged). NFR-05 kept: statuses use emoji and words, not colour alone.
- Reason: Students should not feel overwhelmed; the landing page should spark interest rather than explain.
- Decided by: Elias
- Supersedes: DEC-026 item (1) landing page content

### DEC-029 — Wireframe improvements: gaps, delight, demo flow, staff and quality
- Date: 2026-10-28
- Change: Added to the Phase 2 wireframes: (1) a student "Me" screen (school, CGPA, matching opt-out switch, sign out); (2) a card-icon picker and auto-shortened card titles in the mission form; (3) a "seed planted" step at the end of onboarding; (4) a growth celebration when a watering crosses a tree stage, and a small "+1" toast otherwise; (5) an "approved, +1 watering" banner on the next app open, which covers the demo-step-6 notification while the FR-012 inbox stays a Should; (6) friendly empty states; (7) a demo-only "Switch demo user" menu on staff screens, extending DEC-026; (8) "Try the demo" on the landing page; (9) a phone version of attendance review with Present/Absent buttons and "Approve all present"; (10) design rules: every icon labelled, contrast at least 4.5:1, touch targets at least 44px, motion respects reduce-motion. Emoji replaced by placeholder line icons (final icon set chosen in the visual design); tree visuals use the real `public/tree/` SVGs.
- Affects: Figma "Wireframes — final" (screens 0, 3b, 4, 4b, 7b, 10, 11, 11m, 16 and every staff sidebar). SRS FR-001, FR-008, FR-012 (partial), FR-025, FR-027, FR-028, NFR-05. Mission data gains a card icon (column to add in Phase 2 build).
- Reason: Approved by Elias to close screen gaps, make the student experience rewarding, and make the live demo faster.
- Decided by: Elias
- Supersedes: none

### DEC-030 — Visual style: Garden, Phosphor icons, Khathera's trees unchanged
- Date: 2026-10-28
- Change: no visual style → direction "A. Garden": cream background #FBF7EF, forest green #2E7D32 (the tree's own green), leaf tint #EAF3E2, water blue #4A9FD8, sun yellow #F2C14E, ink #23301F; Fraunces for headings and DM Sans for text; pill buttons, rounded cards (about 22px), soft shadows. Staff screens use the same palette on white with smaller radii and denser layouts. Icons: Phosphor (regular, with fill for active states). Tree art: Khathera's `public/tree/` SVGs unchanged. Directions B (Pop) and C (Calm) were not chosen.
- Affects: Phase 2 visual design (Figma "Style directions" page and the screens to come), NFR-05 (contrast checked on the final palette). The Phosphor React package will be a new dependency at build time, to be confirmed by Elias then.
- Reason: Warm and inviting for students, calm enough for staff and judges, and the green matches the tree so the tree stays the hero.
- Decided by: Elias
- Supersedes: none

### DEC-031 — Light and dark mode
- Date: 2026-10-28
- Change: light only → an Appearance setting with System (default, follows the device), Light and Dark. Students set it in Me; staff in the user menu at the bottom of the sidebar; the landing page follows the device. The choice is saved on the device (no database change). Dark Garden palette: background #131A13, card #1E271D, primary #6CC070 with dark text on buttons, tint #263A22, water #6DB7EA, text #ECE9DF. Tree art unchanged in both modes.
- Affects: Phase 2 visual design (Figma "Style directions" page, design kit and every screen in both modes), screen 16 (Me), staff sidebar, NFR-05 (contrast checked in both modes).
- Reason: Requested by Elias; common student expectation, and comfortable for evening use.
- Decided by: Elias
- Supersedes: none

### DEC-032 — Earth palette: green, light green, brown, black, white
- Date: 2026-10-28
- Change: Garden palette (cream background, forest green, water blue, sun yellow) → five colours only, no cream, no blue, no yellow. Light: background #FFFFFF, green (main) #4E7A3E, light green #DDEBCF, card #F3F7EE, brown #7A4E2D, black text #1C1C1A. Dark: background #121411, green #8DBB6E with dark text on buttons, light green #2A3524, card #1D211B, brown #B07A52, text #F1F1EC. Green is used for buttons, the active tab, banners, water drops and "you're in"; light green for cards, chips and the tree glow; brown for some mission icons, "spots left" and waiting tags; black for text and outlined buttons. Fonts (Fraunces, DM Sans), shapes, Phosphor icons, the Appearance setting and the tree art are unchanged.
- Affects: Phase 2 visual design (Figma "Style directions" page, board "Earth palette — light and dark"), NFR-05 contrast checks.
- Reason: Blue and yellow made the screens feel scattered; a smaller earthy palette is calmer and keeps the tree as the hero.
- Decided by: Elias
- Supersedes: DEC-030 (colour values only), DEC-031 (dark colour values only)

### DEC-033 — Flat colours only: no glows, gradients or shadows
- Date: 2026-10-28
- Change: the tree sat on a soft radial glow, and DEC-030 allowed soft shadows → no glowing effects, gradients or drop shadows anywhere, in light or dark mode. The tree sits on a flat card-coloured panel (#F3F7EE light, #1D211B dark); cards are flat fills.
- Affects: Phase 2 visual design (Figma "Earth palette" board and every screen to come), the growth celebration and landing page animations (motion only, no glow).
- Reason: Requested by Elias; a flat look is calmer and matches the flat tree drawings.
- Decided by: Elias
- Supersedes: DEC-030 (soft shadows only)

### DEC-034 — Layered surfaces and a green header band
- Date: 2026-10-28
- Change: plain white page with pale green cards → layered surfaces: light-mode page #EEF2EA (cool sage-grey, not cream) with white cards and a hairline border (#E3E8DD); a solid deep-green header band (#2F5D2A light, #22391F dark) on the student home, My tree and staff page headers, with the first card overlapping its edge. Dark mode keeps its layered near-black page and lighter cards. Still flat (DEC-033) and within the DEC-032 colours. Green text is used on white cards, not directly on the sage-grey page (4.43:1 there).
- Affects: Phase 2 visual design: Figma variables color/bg/page, color/bg/card, color/border/default; new color/bg/header, color/text/on-header, color/text/on-header-muted; Mission card component border.
- Reason: The plain white background looked generic; layering plus a branded header feels designed and professional, following the layered-surface pattern common in Meta's apps.
- Decided by: Elias
- Supersedes: none

### DEC-035 — Inspiration-driven layout: watering gauge, black tab bar, sans headings, no white
- Date: 2026-10-28
- Change: Following Elias's reference (a nutrition-tracking app layout), using only the DEC-032 colours: (1) the student home's hero is a watering gauge: 12 radial pills in 4 groups of 3 (one group per tree stage), filled in green up to the student's watering count, with the tree, the count and "N more to <next stage>" in the middle; (2) the student tab bar becomes a black bar with rounded top corners, icons only (each with a screen-reader label), and My tree as a green rounded-square centre button; (3) round icon buttons in the top corners with a small centred title; (4) mission cards show an icon avatar, title and time, a large "spots left" number, a row of small facts (place, skill, who can join) and a round green arrow button; (5) headings move from Fraunces to DM Sans SemiBold with tight letter spacing (Display/Hero, Heading/Screen, Heading/Section; new Display/Number); (6) light mode avoids pure white: cards, tab-bar icons and light text use sage tints (#F4F7EF on #E9EFE3), all pairs at least 4.5:1. Kept: flat (no shadows or glows, DEC-033) and no orange or other off-palette colours.
- Affects: Figma Design kit (text styles; new colour variables color/bg/navbar, color/text/on-nav, color/gauge/empty, color/gauge/filled; card, nav, on-primary and on-header now sage), Screens page sample "Student Home" (light and dark, bound to variables). Supersedes the Fraunces headings in DEC-030. The DEC-034 green header band is not used on this home layout; to be confirmed by Elias for other screens.
- Reason: Elias wants the feel of the reference: friendly, modern, data-forward, with one clear hero metric.
- Decided by: Elias
- Supersedes: DEC-030 (heading font only)

### DEC-036 — Matching filters, assignment statuses, availability and score weights
- Date: 2026-10-28
- Change: (1) "missing required eligibility" / "unqualified" → failing the school or minimum-CGPA criteria (FR-029); required skills are not a hard filter and count only in the skill-alignment factor; MISSING_ELIGIBILITY removed from ExclusionReason. (2) none → a student with an assignment for the same mission in any status (PENDING_DEAN_APPROVAL, ACCEPTED, DEAN_REJECTED) is excluded from recommendations as ALREADY_ASSIGNED, following the unique student+mission rule; only PENDING_DEAN_APPROVAL and ACCEPTED on another mission count as time conflicts, as in accept_mission; pending and accepted assignments both hold capacity; Commitment gains status. (3) none → only PUBLISHED missions are matched; matchStudentsToMission rejects other statuses, recommendMissionsForStudent skips them. (4) Dean approval does not affect matching; screens show it from Mission.deanApprovalRequired. (5) availability fit as a 30% score factor → a Stage 1 filter for recommendations only: declared availability that does not fully cover the mission window is excluded as NOT_AVAILABLE; touching windows merge; an empty availability list means unknown, is not excluded, and is reported as Recommendation.availability = "UNKNOWN" (otherwise "FULL"). (6) Score weights 35/30/20/10/5 → availability removed from the score and its 30% redistributed proportionally: skill 35/70 (50%), opportunity balance 20/70 (28.6%), proximity 10/70 (14.3%), reliability 5/70 (7.1%), computed from the base values 35, 20, 10 and 5 divided by the total of the factors that apply; FactorName loses "availability". Availability, CGPA and dean approval never change the score. (7) Students with unknown availability are asked on screen to confirm they are free for the whole mission before accepting; accept_mission gains no availability check and remains responsible for eligibility, duplicate assignment, overlap and capacity. (8) "approved participations in the look-back window" → recentOpportunities counts all of the student's approved participations, all time; the API computes it. (9) A dean rejection is final for that mission for the Oct 29 build (accept_mission returns ALREADY_REJECTED; no reapply or admin undo); recorded as an SRS §12 edge case.
- Affects: SRS FR-007, FR-025 (consent wording), §9 data minimization, §10 Stage 1 and weights table, §12 edge cases, §14 step 4. `AGENTS.md` §3, §5 Phase 3 exit check, §6 Q5, §7. `docs/team/KHATHERA.md` Task 3 and Hand-off. `docs/team/ELIAS.md` Task 4. `src/types/domain.ts` (Student.availability and recentOpportunities comments, Commitment.status, FactorName, Recommendation.availability, ExclusionReason). No database change.
- Reason: Khathera's Task 3 review: removes the ambiguity between skills and eligibility; never recommends a student whom accept_mission would refuse; keeps matching consistent with the Phase 1 schema and functions; recommends only students who can attend the whole mission without hiding new students who have not entered availability (DB default '[]', open question 5); once availability is a filter it cannot distinguish ranked students, so its weight is redistributed proportionally to keep the other factors' relative importance. All-time opportunities is the simplest look-back rule to explain. Proposed by Khathera as DEC-034; renumbered because DEC-034 and DEC-035 were already used by visual design entries.
- Decided by: Khathera (matching module), confirmed by Elias
- Supersedes: SRS §10 starting weights (availability fit 30%)

### DEC-037 — Next-stage watering gauge
- Date: 2026-10-28
- Change: DEC-035's 12-segment whole-journey gauge → a next-stage gauge: one arc segment per watering needed for the next stage (WATERINGS_PER_STAGE, currently 3), filled up to the waterings earned within the current stage; it refills at each stage, and at 12 or more waterings it shows "Full tree" with every segment filled. The current tree stage art sits large inside the arc (Khathera's SVG, unchanged, cropped to its content so small stages such as the seed stay clearly visible), with "N of 3" and "waterings · M more to <next stage>" below. Demo state before step 6: Farid, 2 of 3, seed.
- Affects: Figma Screens page "Sample — Student Home" (light and dark); student home build in Phase 2; FR-027 presentation only (stage rule unchanged).
- Reason: Elias found 12 segments unclear; a gauge that matches exactly the waterings needed next is easier to read.
- Decided by: Elias
- Supersedes: DEC-035 item (1) only

### DEC-038 — Demo missions and staff names; final landing page
- Date: 2026-10-28
- Change: (1) Demo missions shown in the designs → New Student Arrival Welcome, Building D Cleaning Help, Red Cross Kedah Flood Aid, Alor Setar Library Renovation, Hari Raya Food Serving (synthetic; dates illustrative). (2) Staff demo names → Madam Fazilah, Madam Nadya and Mr Zulkiffli, replacing Hakim Zulkifli and Nadia Karim in the designs; they are prototype names only, with no fixed roles (confirmed by Elias). (3) Final landing page (desktop 1440 and phone, light and dark): headline "Show up. Grow something.", a short lead line, Start growing and Try the demo, "Fair by design · Private by default", Khathera's full tree in a light-green circle with floating mission and reward chips, and a "Happening around AIU" strip of the five missions; replaces the earlier phone landing. The database seed is not changed by this entry.
- Affects: Figma Screens page (landing frames), later staff screens and sign-in names; SRS §14 demo script wording when the seed is updated (separate approval).
- Reason: Elias wants realistic, local example missions and names, and a landing page that is interesting rather than informative.
- Decided by: Elias
- Supersedes: DEC-028 item (2) landing layout (headline idea kept)

### DEC-039 — AI drafts the mission description
- Date: 2026-10-28
- Change: FR-023 draft fields "title, skills, time, capacity" → the LLM also drafts a short, cleaned-up mission description from the pasted announcement. The organizer reviews and edits it like every other drafted field before publishing. If the announcement gives too little to describe the mission, the description is left blank and flagged, not invented. A mission still cannot be published without a description (FR-004).
- Affects: SRS FR-023; Phase 4 Gemini prompt and Zod schema; Phase 2 mission form (description field, AI-generated label); `src/types/domain.ts` Mission gains `description` when the mission screens are built (separate approval).
- Reason: Organizers get a ready-to-edit description instead of a blank field or a messy pasted announcement, while the human-in-the-loop rule stays unchanged.
- Decided by: Elias
- Supersedes: none

### DEC-040 — Optional student phone number for mission contact
- Date: 2026-10-28
- Change: none → students may enter an optional phone number at registration and edit it in their profile, so organizers can contact them about a mission. Staff (organizers and admins) have no phone field. The number is visible only to the student, admins, and the organizer of a mission on which the student has a PENDING_DEAN_APPROVAL or ACCEPTED assignment; this is enforced with row-level security. A DEAN_REJECTED assignment gives no access. Seed data uses synthetic numbers only. Built in Phase 2.
- Affects: new migration (phone column and RLS policy); Phase 2 registration and student profile screens; organizer mission roster; FR-025 consent screen wording; SRS §9 data minimization; `src/types/domain.ts` (Student gains an optional phone, separate approval when the screens are built); demo seed.
- Reason: Organizers need a way to reach the students on their missions; keeping it optional and limited to assigned missions collects and shows as little personal data as possible.
- Decided by: Elias
- Supersedes: none

### DEC-041 — Phase 2 build choices
- Date: 2026-10-28
- Change: (1) DEC-030's icon package confirmed: `@phosphor-icons/react` 2.1.10 added as a dependency. (2) Demo seed renamed to match the designs (DEC-038): the three demo missions become New Student Arrival Welcome (was Orientation Week Welcome Desk), Red Cross Kedah Flood Aid (was SCI Research Showcase Guides) and Building D Cleaning Help (was Campus Clean-Up Morning); the admin becomes Madam Nadya and the organizer Madam Fazilah. Dates, capacities, skills and criteria are unchanged, so the matching seed check and the DB tests still hold. (3) Sign-in for the Oct 29 build is the demo accounts only (DEC-026 one-tap demo sign-in); screens 2 and 3 run as first-login onboarding, with no self-registration form. (4) The organizer's recommended-students panel with override and logged reason (BR-11, open question 6) stays in Phase 3; Phase 2 uses matching on the student side only. (5) Each Phase 2 slice is merged to `main` as soon as it works, so the Vercel URL always shows the latest working journey.
- Affects: `package.json`, lockfile, `supabase/seed.sql` and the live demo data, Phase 2 build order, AGENTS.md §6 Q6 (unchanged, deferred).
- Reason: Approved by Elias to ship the core journey before the Oct 29 submission with the least risk.
- Decided by: Elias
- Supersedes: none

### DEC-042 — Scroll-grown tree hero for the landing page (after the journey)
- Date: 2026-10-28
- Change: the DEC-038 landing hero → a scroll-scrubbed hero adapted from the 21st.dev component "LycorisSpecimen" (by kedhareswer; its scroll, camera and WebGL engine kept, the flower replaced by a procedural tree that grows from seed to blossom over six frames: Seed, Sprout, Sapling, Young tree, Full tree, Bloom). Kept from existing decisions: attendance wording, no hours (DEC-008): frame 4 "Your organizer confirms you were there." / "Every approved participation counts, exactly once."; frame 5 "Every approved volunteer gets a certificate."; the DEC-032 palette, DM Sans headings and light and dark mode (DEC-031, DEC-035), not the brief's cream, rust and Fraunces; the frame 2 "Why recommended" card shows the real factors (skills, opportunity balance, reliability; DEC-036), not availability. Built after the Phase 2 journey works on Vercel. The component's licence is checked on its 21st.dev page before use and credited in the README and the declaration list.
- Affects: `src/components/ui/` (new), landing page, README, declaration form third-party sources.
- Reason: Elias wants a memorable landing page; the conflicting parts of the brief were resolved in favour of the logged decisions.
- Decided by: Elias
- Supersedes: DEC-038 item (3) hero layout, once built

### DEC-043 — Phase 2 database support: consent, spots left, phone contacts
- Date: 2026-10-28
- Change: new migration `20261028150000_phase2_support.sql`, applied to the live project: (1) `record_consent(version, opt_out)` lets a student store the consent version and the matching opt-out (FR-025); profiles keep no direct update grant. (2) `mission_spots()` returns how many spots are held (ACCEPTED plus PENDING_DEAN_APPROVAL) on each published mission, never who holds them, because students cannot read other students' assignments (FR-006, FR-030). (3) DEC-040's phone number: an optional `student_profiles.phone` column with a format check, updatable by the student; organizers read it only through `mission_contacts(mission_id)`, which returns names and phones of PENDING_DEAN_APPROVAL or ACCEPTED students to that mission's organizer or an admin. A function is used instead of a row-level policy so organizers never see the CGPA on the same row (BR-15). The DEC-041 seed rename was also applied to the live data.
- Affects: `supabase/migrations/`, `supabase/seed.sql`, live Supabase project, Phase 2 student and organizer screens.
- Reason: Approved by Elias; the Phase 1 schema could not save consent, show spots left to students, or share phone numbers on assigned missions only.
- Decided by: Elias
- Supersedes: none

### DEC-044 — Test data hidden from the demo instead of deleted
- Date: 2026-10-29
- Change: Phase 1 test runs left about 45 published test missions and 8 "Test" logins in the live project. They cannot be deleted, because their watering ledger and audit rows are append-only (NFR-07). Instead, the test organization's missions were set to CANCELLED and the test logins marked deactivated, and `supabase/tests/phase1.test.ts` now does the same after every run. Demo screens show only PUBLISHED missions, so students and matching never see test missions.
- Affects: live Supabase data, `supabase/tests/phase1.test.ts`; Phase 2 screens leave out deactivated users.
- Reason: Approved by Elias; the demo must show only the seeded demo missions and people.
- Decided by: Elias
- Supersedes: none

### DEC-045 — Baseline evaluation setup
- Date: 2026-10-29
- Change: none → FR-026 evaluation in `scripts/evaluate/` (Khathera Task 4, PR #11): seed 20261028, 100 synthetic students, 20 missions (5 gated), interest probability 0.35, uneven history (40/30/20/10%), FCFS-random as the primary baseline and a capped FCFS-engaged sensitivity check, 10 extra seeds and an equal-history scenario; assumptions A1–A6 in `scripts/evaluate/README.md`. Run with `npm run evaluate` (`tsx` added as a dev dependency). `.gitattributes` keeps `results.md` at LF line endings so the up-to-date check passes on Windows checkouts. The main README links the evaluation in Phase 6.
- Affects: FR-026; `scripts/evaluate/`; `package.json`, lockfile, `.gitattributes`; README (Phase 6).
- Reason: Fairness-first, reproducible comparison using the unchanged DEC-036 engine.
- Decided by: Khathera (evaluation module), confirmed by Elias
- Supersedes: none

### DEC-046 — LLM intake: model, usage log and redaction
- Date: 2026-10-29
- Change: (1) FR-023 is built in `src/lib/intake/draft.ts`: the organizer or admin pastes an announcement, Gemini returns JSON that is validated with a Zod schema, missing fields come back blank and are listed as flagged, the form shows an "AI-generated draft" label, the mission is saved with source `ai_draft`, and nothing is published automatically; any AI failure falls back to the manual form. (2) Model: `gemini-2.5-flash` was chosen, but Google no longer offers it to new users; the replacement model is to be confirmed by Elias once billing is enabled. (3) New append-only table `ai_usage_log` (SRS §7 AiUsageLog: feature, model, version, prompt hash, actor, success, time), written by staff for their own calls and readable by admins only; the prompt text itself is not stored. (4) Open question 8 resolved: email addresses and phone numbers are replaced with [email] and [phone] before the text is sent to Gemini.
- Affects: SRS FR-023, §7 data model, AGENTS.md §6 Q8; `supabase/migrations/20261029090000_ai_usage_log.sql` (applied to the live project); mission form.
- Reason: Approved by Elias; keeps the human in the loop, records every AI call for the declaration form, and sends as little personal data as possible.
- Decided by: Elias
- Supersedes: none

### DEC-047 — Cancelling missions and discarding drafts
- Date: 2026-10-29
- Change: found in the live end-to-end test. (1) Assignments on a cancelled mission no longer hold the student's time: `accept_mission` and the matching input skip cancelled missions, and My missions shows them under Past as "Mission cancelled" (SRS §12: mission cancelled after sign-up, no penalty). (2) New function `cancel_mission`: the mission's organizer or an admin cancels a draft or a published mission, with an audit entry; a mission with an approved participation cannot be cancelled until an admin revokes it. (3) The completeness rule now applies only to published and completed missions, so an incomplete draft can be discarded (cancelled). (4) Staff get "Cancel mission" on the mission page and "Discard draft" on the draft page. Student notification of a cancellation stays with FR-012 (Should).
- Affects: new migration `20261029120000_cancel_missions.sql` (applied to the live project), `accept_mission`, missions check constraint, student and staff screens.
- Reason: Approved by Elias after the end-to-end test found that cancelled missions still blocked students and drafts could never be removed.
- Decided by: Elias
- Supersedes: none

### DEC-048 — Declared availability removed
- Date: 2026-10-29
- Change: students no longer declare availability. They accept only missions they can attend. The app passes an empty availability list to matching for every student, so matching excludes no one for availability (it reads an empty list as unknown). The "Are you free for the whole mission?" step before accepting and its "Set my availability" link are removed, so accepting is one tap. The consent notice no longer mentions free time. Time-conflict checks stay: matching still skips missions that overlap a pending or accepted assignment, and `accept_mission` still rejects overlaps. The `student_profiles.availability` column and the matching module's availability filter stay in place, unused; removing them is a later clean-up. Resolves AGENTS.md §6 open question 5 for availability (skills entry stays open). The SRS §10 Stage 1 availability filter and the FR-025 wording are superseded by this entry.
- Affects: `src/lib/db/student.ts`, student mission screen and accept button, consent screen (screen 2); DEC-036 availability rules.
- Reason: Approved by Elias after a published mission did not reach a demo student whose declared availability covered other days; there is no screen to declare availability, so the filter hid missions for no reason the student could see or fix.
- Decided by: Elias
- Supersedes: the availability parts of DEC-036

### DEC-049 — LLM intake moves from Gemini to Groq
- Date: 2026-10-29
- Change: mission intake (FR-023) calls Groq instead of Google Gemini. Model `openai/gpt-oss-120b`, through Groq's OpenAI-compatible chat completions endpoint with plain `fetch` and JSON mode; no SDK. `@google/genai` is uninstalled and `GEMINI_API_KEY` is replaced by `GROQ_API_KEY` (server only). The prompt now gives today's weekday as well as the date (prompt version `intake-v2`), because without it the model sometimes turned "next Saturday" into a Friday. Everything else in DEC-046 stays: Zod validation, redaction of emails and phone numbers, blanks flagged, AI-generated label, `ai_usage_log`, manual form as fallback, nothing published automatically.
- Affects: `src/lib/intake/draft.ts`, `.env.example`, `package.json` and lockfile, AGENTS.md §4 stack and §6 Q8; Vercel environment variables.
- Reason: Approved by Elias; the Gemini project had no free tier and needed billing. Of the Groq models available to the key, a live test with a synthetic announcement showed only `openai/gpt-oss-120b` resolved "next Saturday" correctly (`openai/gpt-oss-20b` gave a Friday, `qwen/qwen3.8-27b` the week after); with the weekday in the prompt it was correct 5 times out of 5.
- Decided by: Elias
- Supersedes: the provider and model parts of DEC-046

### DEC-050 — Skills no longer affect the ranking
- Date: 2026-10-29
- Change: missions keep their skills, and students still see and search them, but the app passes no skills to matching, so the skill factor is left out of the score. Matching already scales the remaining weights to add up to 1, so "Why recommended" now shows opportunity balance 80% and reliability 20% (proximity stays unused). The consent notice now says students with fewer chances so far are suggested first, instead of mentioning skills. The matching module, its tests and the evaluation script are unchanged; `scripts/evaluate/results.md` was computed with skills, so the evaluation write-up must say the live app ranks without them. Planned next step: a fixed skill list chosen by students (FR-003) and organizers, with the AI limited to that list; then skills can be passed to matching again.
- Affects: `src/lib/db/student.ts` (`toMission`), consent screen (screen 2); DEC-036 score weights in practice; FR-007 explanation.
- Reason: Approved by Elias after a student was recommended with "0 of 5 required skills". Students have no screen to declare skills, and the AI writes free-text skills that rarely match exactly, so the factor added noise and half the score without information.
- Decided by: Elias
- Supersedes: the skill part of the DEC-036 score weights, until the skill list exists

### DEC-051 — The tree becomes a palm tree
- Date: 2026-10-29
- Change: the tree is drawn as a palm everywhere. Landing page (screen 0): the WebGL model is a palm whose trunk is covered in sharp-edged diamond scales (old frond bases, in crossing spirals) and carries a crown of 16 feather fronds, standing on a low round plinth (a specimen base) that widens with the trunk, from just wider than the young palm's foot to full size; scrolling first opens fronds at ground level, then the trunk rises and carries the crown up. Student screens: Khathera redraws the 5 stage SVGs as a palm's life (date seed, spear leaf, trunkless young palm, short-trunk palm, full palm with dates), with a gentle CSS sway that stops under reduced motion (`docs/team/KHATHERA.md` Task 5). Stage names, stage IDs, the 3-watering step and `getTreeStage` are unchanged, and "tree" stays the product word.
- Affects: `src/components/growing-tree.tsx`; `public/tree/` (Khathera); FR-027 stage art; DEC-006 stage drawings.
- Reason: Approved by Elias; a palm (date palm) fits the campus setting and its life stages read clearly.
- Decided by: Elias
- Supersedes: the drawing style of the DEC-006 stages

### DEC-052 — Attendance opens at the start; Mark all present; QR check-in
- Date: 2026-10-29
- Change: (1) Present and Absent appear once the mission has started, not only after it ends, so organizers can take attendance at the event. (2) "Mark all present" approves every confirmed student who isn't marked yet; each approval still goes through `approve_completion`, so it adds exactly one watering and repeating it changes nothing. (3) QR check-in (FR-016, Should): from 1 hour before the start until the end, the organizer or an admin taps "Start check-in", which gives the mission a random secret (`check_in_sessions`, readable only by the mission's organizer and admins). The screen shows a QR whose code is the first 12 hex characters of HMAC-SHA256(secret, mission ID and current minute), so it changes every minute; the current and previous minute's codes are accepted. Students scan it with the phone camera, which opens `/student/check-in/[id]`, and tap "I'm here"; `check_in` records one row in `check_ins` per assignment. The review screen shows who checked in. Checking in never approves attendance or waters a tree: the organizer still taps Present or Mark all present. (4) Demo seed: an in-progress mission "Campus Open Day Helpers" with Farid and Mei Lin confirmed, for the QR demo; `supabase/seed.sql` has the SQL to move it back into progress before a pitch. "Building D Cleaning Help" (ended, Farid and Mei Lin waiting) still serves demo step 5.
- Affects: new migration `20261029150000_check_ins.sql` (applied to the live project), new dependency `qrcode` (and `@types/qrcode`), `src/lib/check-in.ts`, staff and student actions, attendance review, new student screen `/student/check-in/[id]`, seed data (live and `supabase/seed.sql`); FR-008, FR-016; AGENTS.md §6 Q13.
- Reason: Approved by Elias after the Phase 2 exit check found that attendance could not be taken during a live demo. Elias chose a 1-minute code, scan records "checked in" (not approval), and a re-timeable demo mission.
- Decided by: Elias
- Supersedes: none

### DEC-053 — Palm stage names and three growth animations
- Date: 2026-10-29
- Change: (1) The last two stage labels follow the date palm drawings: Seed, Sprout, Sapling, **Young palm**, **Date palm** (were Young tree, Full tree), e.g. "You grew a Date palm". Stage keys (`young-tree`, `full-tree`), file paths and `getTreeStage` are unchanged, and "tree" stays the product word (My tree, "waters your tree"). (2) Three CSS animations, all inside `prefers-reduced-motion: no-preference`, so with reduced motion each screen shows its final state: the "You grew" celebration (three drops fall, the old stage shrinks away, the new stage grows in with a soft glow); the student home gauge (when a new watering has arrived since the student last looked on this device, one drop falls into the tree and a ripple spreads; the count seen is kept on the device only, like the last stage seen); the "Your seed is planted" screen (the seed drops into the soil with a small bounce). (3) `.gitattributes` keeps `public/tree/*.svg` on LF endings, so Khathera's SVG checks pass on Windows checkouts too.
- Affects: `src/components/gauge.tsx`, `growth-celebration.tsx`, new `water-drop.tsx` and `watering-drop.tsx`, `src/app/globals.css`, student home and planted screens, landing copy, `.gitattributes`; FR-027 presentation only.
- Reason: Approved by Elias after Khathera's palm stages (PR #19) asked whether the labels should change; Elias also asked for animation.
- Decided by: Elias
- Supersedes: the "Young tree" and "Full tree" stage labels; also the "tree art unchanged" parts of DEC-030 and DEC-031, which DEC-051 replaced in practice but did not name (requested by Khathera in PR #19)

### DEC-054 — Evaluation matches the live configuration
- Date: 2026-10-29
- Change: one evaluated configuration → two configurations of the same synthetic scenario (seed 20261028). (1) Live configuration, the primary result: every mission lists no required skills, every student has availability [] (DEC-048) and reliability null, so the unchanged DEC-036 engine uses opportunity balance 20/25 (80%) and reliability 5/25 (20%); because reliability is the same 0.5 for everyone, the ranking is decided by opportunity balance alone, with ties by student ID. Ability to attend is modelled as student self-selection, not as a matching filter: a student takes a mission only if interested and their synthetic availability covers it (none entered counts as free), the same for Voluntree and FCFS. Skill-matched placements, skill alignment and mean reliability of placed students are reported as Not applicable. (2) Future configuration: the original Task 4 simulation, unchanged (skills, declared availability, generated reliability; skill 35/60, opportunity balance 20/60, reliability 5/60), a hypothetical comparison for if students could choose skills and declare availability, not a confirmed feature. Both configurations run the main seed, 10 extra seeds and the equal-history scenario; `npm run evaluate` regenerates both into results.md, which stays byte-for-byte reproducible.
- Affects: FR-026; scripts/evaluate/ (generate.ts, report.ts, run.ts, tests, README.md, results.md); DEC-045 (setup extended).
- Reason: After DEC-048 and DEC-050 the app passes no availability, no skills and no reliability data to matching, so the original evaluation no longer matched what students experience. Proposed by Khathera in PR #22 as DEC-050; renumbered because DEC-050 to DEC-053 were taken.
- Decided by: Elias (assigned), Khathera (evaluation module)
- Supersedes: none

### DEC-055 — "Try as a new student" guest accounts; sign-in feedback
- Date: 2026-10-29
- Change: (1) The sign-in page gets a "Try as a new student" button. One tap creates a synthetic guest student ("Guest 4821", email `guest-<number>-<random>@voluntree.test`, a random password nobody sees), signs them in and starts onboarding at the consent screen, so each visitor has their own seed and journey instead of sharing Farid. The server creates guests with the service-role key (`src/lib/db/admin.ts`, server only), because the project has anonymous sign-in off and Supabase rejects self sign-up with `.test` addresses. New column `profiles.is_guest` (users can't change it: they have no write access to `profiles`). Guests are left out of the admin overview (counters, fairness chart, activity) so the demo numbers stay stable; they appear on the rosters of missions they join, so an organizer can approve them. No real student data is collected (AGENTS.md rule 10 holds). (2) Sign-in feedback: the tapped demo card shows "Signing in…" with a spinner and every card is disabled while it runs; the email form keeps the typed email after a wrong password.
- Affects: new migration `20261029170000_guest_students.sql` (applied to the live project), `src/app/sign-in/` (actions, new `demo-buttons.tsx`, email form), `src/lib/db/admin.ts`, admin overview; FR-001; DEC-041 (demo accounts only) extended with guest students. Needs `SUPABASE_SERVICE_ROLE_KEY` in the Vercel environment.
- Reason: Approved by Elias so students can try the demo with an account of their own; chose synthetic guests over real sign-up to keep rule 10.
- Decided by: Elias
- Supersedes: none

### DEC-056 — Farid starts as a Sprout; growth journey; live feel in every action
- Date: 2026-10-29
- Change: (1) Demo seed: Farid takes part in the first 5 past missions instead of 2, so he starts at 5 waterings (a Sprout, one phase completed, 2 of 3 toward Sapling) with 5 certificates; the live approval in demo step 6 takes him to 6 and shows "You grew a Sapling". Applied to the live project the same way the seed writes history (assignment, approved completion, one +1 watering and one certificate per mission). (2) My tree shows the growth journey: all five palm stages in a row (done stages in full, future stages faded, the current one ringed and marked "You are here"); a gentle pop travels from Seed to Date palm and loops. (3) Live feel: every button and link gives a small press and eases its colours; each new screen fades in (`template.tsx` per area, so tab bars and staff navigation stay put and 5-second polling does not replay it); lists and staff tables come in one row after another, and rows that appear later through polling rise in on their own. All motion is inside `prefers-reduced-motion: no-preference`.
- Affects: `supabase/seed.sql` and live demo data; DEC-021 (demo student starting point); My tree screen; `src/app/globals.css`; new `template.tsx` in student, student tabs, organizer and admin; student and staff lists.
- Reason: Approved by Elias: Farid should have completed at least one phase during the demo, the palm stages should animate continuously in the student portal, and the website should feel live in every action.
- Decided by: Elias
- Supersedes: the "demo student starts at 2 waterings" part of DEC-021

### DEC-057 — Editing published missions
- Date: 2026-10-29
- Change: organizers and admins can edit a published mission until it starts, from an "Edit" button on the mission page and an "Edit" link in the missions list (the existing form at `/organizer/new?id=` and `/admin/new?id=`, titled "Edit mission", with one "Save changes" button that keeps the publish checks). Title, description, place, skills, safety notes and slots stay editable; once any student has joined (pending dean approval or accepted), the date and time lock (shown read-only with an explanation) and slots can't go below the students already in. Criteria keep their own lock (BR-14); the form now leaves locked criteria as they are instead of sending them empty. Saving changes keeps the original publish time and returns to the mission page. A mission that has started can't be edited. The rules are enforced in the database by a new trigger, `check_mission_edit`, which skips changes made without a signed-in user (seed scripts, the SQL editor, re-timing the demo mission) and status-only changes (cancelling). Students aren't notified of changes (FR-012 is a Should); the form tells staff to mention big changes themselves.
- Affects: new migration `20261029180000_edit_published_missions.sql` (applied to the live project), `saveMission`, `loadDraft`, mission form, organizer and admin form pages, mission page, missions list; FR-004.
- Reason: Approved by Elias: staff need to fix a published mission without cancelling it, without surprising students who already joined.
- Decided by: Elias
- Supersedes: none

### DEC-058 — In-app notifications
- Date: 2026-10-29
- Change: FR-012 built. A `notifications` table filled by database triggers on the tables the existing functions already change (mission_assignments, completions, missions, check_ins), so each event gives exactly one notification in the same transaction and no tested function changed. Students: invitation when an upcoming mission they are eligible for is published (school and CGPA only, not the score; not sent to students who opted out of suggestions), you're in or request sent to the dean, the dean's decision, attendance approved (watering and certificate ready), marked absent, approval revoked, and a joined mission edited (what changed: title, time, place, description, safety notes) or cancelled. Organizers: a student joined, a student checked in by QR. Admins: a new dean approval request. Missions of the Phase 1 test organization never send invitations or admin alerts, so test runs can't fill the demo inboxes. Screens: a bell with the unread count on every student tab (top right) and an "Inbox" item with a badge in the staff menu; the 5-second refresh keeps counts live and the badge pops when it changes. Inbox pages for each role; opening the inbox marks everything read. People read only their own notifications and can change only `read_at`.
- Affects: new migration `20261029190000_notifications.sql` (applied to the live project), student tabs layout, organizer and admin layouts, new inbox pages and components; FR-012; closes the "students aren't notified" gap in DEC-057.
- Reason: Approved by Elias; chose all four student event groups (status changes, approval and certificate, changes and cancellations, invitations) and staff notifications.
- Decided by: Elias
- Supersedes: none

### DEC-059 — Scanning the QR checks in by itself
- Date: 2026-10-29
- Change: opening the check-in link from the QR now records the check-in straight away; the student no longer taps "I'm here" (DEC-052). The page shows "Checking you in…" and then "Checked in at …". "I'm here" stays only as a retry if the check-in fails (for example an expired code), with the error shown. The check-in runs in the browser after the page opens, never during a server render or a link preview. All database rules are unchanged: the code must be from the current or previous minute, the student must be confirmed on the mission, and a second scan changes nothing. Checking in still never approves attendance.
- Affects: `src/app/student/check-in/[id]/` (button and page comment); DEC-052 step "tap I'm here".
- Reason: Approved by Elias: scanning with the student's phone should be enough.
- Decided by: Elias
- Supersedes: the "tap I'm here" step of DEC-052

### DEC-060 — Admin "Users" page
- Date: 2026-10-29
- Change: a view-only "Users" page in the admin menu lists every account with role, organization (organizers), status (Active; Onboarding when a student has not agreed to the consent notice yet; Guest; Deactivated), school and CGPA, approved participations, upcoming missions joined, requests waiting for the dean, suggestions on or off, and when the account was created. Filter by role, search by name; deactivated accounts (including the test logins, DEC-044) are hidden unless "Show deactivated" is on. It uses data admins can already read under row-level security, so no database change. CGPA stays admin-only (FR-028). The palm tree stays private to each student (BR-13): the page shows the number of approved participations, the same count as the fairness chart, not the tree.
- Affects: new `src/app/admin/users/page.tsx`, admin menu; FR-014 (part).
- Reason: Approved by Elias: admins need one place to see everyone and their status.
- Decided by: Elias
- Supersedes: none
