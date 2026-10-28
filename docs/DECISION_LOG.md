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
- Change: (1) Demo missions shown in the designs → New Student Arrival Welcome, Building D Cleaning Help, Red Cross Kedah Flood Aid, Alor Setar Library Renovation, Hari Raya Food Serving (synthetic; dates illustrative). (2) Staff demo names → Madam Fazilah, Madam Nadya and Mr Zulkiffli, replacing Hakim Zulkifli and Nadia Karim in the designs; their roles are proposed as Madam Fazilah organizer, Madam Nadya admin, Mr Zulkiffli second organizer, pending Elias's confirmation. (3) Final landing page (desktop 1440 and phone, light and dark): headline "Show up. Grow something.", a short lead line, Start growing and Try the demo, "Fair by design · Private by default", Khathera's full tree in a light-green circle with floating mission and reward chips, and a "Happening around AIU" strip of the five missions; replaces the earlier phone landing. The database seed is not changed by this entry.
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
