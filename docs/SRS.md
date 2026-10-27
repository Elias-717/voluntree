# Software Requirements Specification (SRS)

## Voluntree: Fair, Explainable Volunteer Matching for AIU

Version: 1.1 (revised for the MMC Upstart 2026 rubric) Status: Implementation baseline for a 2-week build Date: 27 October 2026 Competition: MMC Upstart 2026 Catalyst: Igniting Future Innovation, AIU Alor Setar Focus area: 02 Smart Campus and Institutional Systems

Assumptions note: AIU deployment, sponsorship and certificate branding are NOT confirmed. All demo data is synthetic. Items in \[BRACKETS\] are placeholders to be filled with real findings (survey, interview) before submission. Do not present placeholders as facts.

## 1. Problem, Users and Measurable Outcome

### 1.1 Problem statement

Campus events at AIU depend on student volunteers, but recruitment is manual (group chats, posters, first-come-first-served replies). This causes three problems: the same few students get most opportunities, organizers spend time chasing and verifying volunteers, and students rarely receive verified recognition for their service. \[Insert evidence: survey result, organizer quote, or desk-research source.\]

### 1.2 Named users

- Primary user: AIU student volunteer (final-year or junior students who want fair access to opportunities and verified service records).

- Secondary user: Event organizer (club officer or staff who needs the right volunteers quickly and a trustworthy participation record).

- Tertiary user: Administrator (student affairs or events office who needs oversight and audit).

### 1.3 Measurable outcomes (hypotheses to validate)

| Metric                                                       | Baseline (first-come-first-served) | Target with Voluntree                 | How measured              |
|--------------------------------------------------------------|------------------------------------|---------------------------------------|---------------------------|
| Volunteer slot fill with skill-matched students              | \[measure on seeded data\]         | Higher than baseline                  | Seeded simulation, FR-026 |
| Spread of opportunities across students                      | \[measure\]                        | More even (lower Gini or max-min gap) | Seeded simulation         |
| Organizer time to verify a volunteer and issue a certificate | \[survey or timed demo\]           | Under 1 minute per volunteer          | Timed demo                |
| Time conflicts offered to students                           | \[measure\]                        | Zero                                  | Automated test            |
| Certificate issued after approval                            | Manual / none                      | Under 10 seconds, no duplicates       | Automated test            |

### 1.3.1 Evidence plan (fallback ladder)

1.  Preferred: survey of 20 or more AIU students (3 to 5 questions on how they find volunteering, whether they get recognition, and whether they feel opportunities are fair).

2.  If not possible: interview one organizer, club or the management office and record the pain points in their own words (with permission).

3.  Last resort: cited desk research on volunteer engagement and recognition. State clearly that primary evidence was not collected.

Survey responses must be anonymous, voluntary and consented (see section 9).

## 2. Scope and Priorities

Requirement priorities:

- M: Must-have. Required for the competition prototype and the live demo.

- S: Should-have. Implement only if the Must-haves are complete and tested.

- F: Future. Shown only as labeled future work, never as a working feature.

Requirement IDs are stable for traceability. The competition requires at least one complete end-to-end journey (input, AI or data processing, output). The journey for this product is: organizer posts an event, AI structures it, matching recommends volunteers with explanations, students accept, organizer verifies, one watering and a certificate are issued once.

## 3. Assumptions and Operating Environment

- Stack: Next.js, TypeScript and Tailwind as a mobile-first PWA on Vercel (HTTPS); Supabase for PostgreSQL, authentication, row-level security and real-time events; capacity and idempotency enforced with Postgres functions, row locks and unique constraints; matching and evaluation in TypeScript with Vitest tests; PDF certificates with pdf-lib or pdfkit on the server; LLM mission intake through the Google Gemini API called only from a server route, with output validated against a schema and a manual form as fallback. Every tool, model and prompt is recorded for the declaration form.

- Synthetic demonstration data only, unless written consent and institutional approval exist.

- Three roles: STUDENT, ORGANIZER, ADMIN. No role self-elevation.

- All watering, approval and certificate actions run on the trusted server.

- In-app notification inbox is authoritative; web push is optional.

- Team size is currently undetermined (planned for 3 to 5). Roles are in section 15.

## 4. Actors and Authorization Matrix

| Action                     | Student      | Organizer               | Admin                                          |
|----------------------------|--------------|-------------------------|------------------------------------------------|
| View eligible missions     | Yes          | Yes                     | Yes                                            |
| Create and publish mission | No           | Own organization        | All authorized                                 |
| Accept own assignment      | Yes          | No                      | No                                             |
| Verify participation       | No           | Own missions            | Override with audit                            |
| Edit waterings directly    | No           | No                      | No (audited revocation entry with reason only) |
| Download certificate       | Own          | Own missions            | Authorized lookup                              |
| Override AI recommendation | No           | Yes, with logged reason | Yes, with logged reason                        |
| Access audit trail         | Own activity | Scoped                  | Full authorized scope                          |

## 5. Functional Requirements

### 5.1 Core journey (Must-have)

#### FR-001 \[M\] Authentication

The system shall authenticate users with a unique internal identifier. Acceptance: no duplicate profile for one identity; demo login works for each role.

#### FR-002 \[M\] Role-Based Access Control

The system shall enforce role checks on the server and at row level. Acceptance: a student request to publish a mission or review a completion returns forbidden.

#### FR-004 \[M\] Mission Creation and Publishing

Organizers shall create and publish a mission with title, description, required skills, place, time window, capacity, verification policy and safety notes. Acceptance: incomplete or invalid missions cannot be published; valid missions appear to eligible students.

#### FR-005 \[M\] Mission Lifecycle (simplified)

Mission states: DRAFT, PUBLISHED, IN_PROGRESS, PENDING_VERIFICATION, COMPLETED, plus CANCELLED. For the Oct 29 build, DRAFT, PUBLISHED, COMPLETED and CANCELLED are enough; the intermediate states are Stretch. Acceptance: invalid transitions are rejected; each change records actor and timestamp.

#### FR-006 \[M\] Mission Acceptance

Students shall accept a mission. Withdrawal before an organizer-defined cutoff is Stretch for the Oct 29 build. Acceptance: no duplicate active assignment; capacity is never exceeded under concurrent requests.

#### FR-007 \[M\] Explainable Volunteer Matching

Matching shall first exclude hard conflicts (time overlap, required eligibility, capacity), then rank the remaining students by a transparent weighted score (section 10). Acceptance: seeded fixtures give deterministic results; every recommendation shows a Why recommended panel listing the factors that applied.

#### FR-008 \[M\] Participation Verification

Organizers shall approve or reject completed participation (attendance) with an optional note. Acceptance: students cannot self-approve; rejection grants no watering or certificate.

#### FR-009 \[M\] Watering Record

Each approved qualifying participation shall create exactly one watering entry in an append-only ledger. An admin may revoke a mistaken or fraudulent approval only by adding a revocation entry with a logged reason. Acceptance: retrying the same approval does not duplicate the watering; a revocation without a reason is rejected.

#### FR-010 \[M\] Automatic Certificate of Appreciation

For each approved participation the system shall generate a PDF containing student name, mission title, date and a unique certificate ID. Acceptance: PDF downloads; re-request returns the same certificate record; approval is required first.

#### FR-011 \[M\] Real-Time Updates

Student and organizer screens shall reflect approvals through real-time events, with refresh fallback. For the Oct 29 build, a refresh or polling every few seconds is acceptable. Acceptance: waterings, tree stage, mission status and organizer counters update within 5 seconds on a test network.

#### FR-027 \[M\] Growing Tree

Each student shall see a tree with five stages: seed (0 waterings), sprout (3), sapling (6), young tree (9) and full tree (12). The stage is derived from the student's net watering count in the ledger (FR-009); the step of 3 is a configuration value. After 12 waterings the tree stays full while waterings keep counting. The tree never shrinks except when an admin revokes an approval (FR-009), and it is visible only to that student (BR-13). Acceptance: an approval that crosses a stage threshold shows the next stage on the student's screen; repeating the approval leaves the stage unchanged.

### 5.2 AI and responsible-AI features (Must-have)

#### FR-023 \[M\] LLM-Assisted Mission Intake (human in the loop)

An organizer shall paste a free-text event announcement; a language model drafts a structured mission (title, skills, time, capacity). The organizer must review and edit the draft before publishing. Acceptance: the model output is never published automatically; the draft is labeled AI-generated; the model name, version and prompt are recorded for the declaration form; unverifiable or missing fields are left blank and flagged, not invented.

#### FR-024 \[M\] Fairness-Aware Opportunity Balancing

The ranking shall include an exposure-balancing factor that raises students who have received few opportunities, and a cold-start rule so new students are not penalized for lacking reliability history. Acceptance: in the seeded evaluation, opportunity spread across students is measurably more even than under first-come-first-served; new students appear in recommendations.

#### FR-025 \[M\] Consent and Transparency Screen

On first login students shall see a plain-language notice stating what data is used (declared skills and availability only), that participation is optional, how to opt out, and that humans make final decisions. A consent version is stored per user. Acceptance: a student who opts out of matching is excluded from ranking but can still browse missions; the screen is shown in the demo.

#### FR-026 \[M\] Baseline Evaluation Report

The system (or a documented script) shall compare Voluntree matching with a first-come-first-served baseline on the seeded dataset and output the metrics in section 1.3. Acceptance: results are reproducible from the README and shown honestly, including trade-offs and cases where the baseline wins.

### 5.3 Should-have (only after all Must-haves pass)

#### FR-003 \[S\] Student Profile

Students manage optional skills, availability and accessibility preferences, private by default.

#### FR-012 \[S\] In-App Notifications

In-app record for invitation, status change, approval and certificate ready.

#### FR-014 \[S\] Organizer Dashboard

Scoped view of missions, applicants, approved participations and pending checks.

#### FR-015 \[S\] Admin Dashboard

Platform summary and audit records with scope checks.

#### FR-016 \[S\] Anti-Fraud Check-In

Expiring one-use QR or check-in nonce; replay rejected; doubtful events flagged for review.

### 5.4 Future (label clearly in the pitch as future work)

- FR-017 \[F\] Reward inventory and simulated voucher claims. Moved to Future because sponsorship is unconfirmed and it adds fairness and stock-race complexity.

- FR-019 \[F\] Event logistics batching.

- FR-020 \[F\] Delivery route optimization.

- FR-021 \[F\] Sponsored trips and activities (needs consent and safety processes).

- FR-022 \[F\] Public certificate verification via a privacy-preserving code.

## 6. Business Rules and Invariants

| Rule ID | Rule                                                                                                                                                                          |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| BR-01   | A mission cannot add a watering before organizer approval.                                                                                                                    |
| BR-02   | One active enrollment per student per mission.                                                                                                                                |
| BR-03   | Waterings are lifetime and non-transferable. They are never spent, never exchanged for money, and never deducted except by an admin revocation with a logged reason (FR-009). |
| BR-04   | Any prize requires preconfigured stock or budget and explicit authorization (applies when rewards are implemented).                                                           |
| BR-05   | Every approved volunteer receives a certificate regardless of watering count, rank or prize eligibility.                                                                      |
| BR-07   | Duplicated or reversed approvals create no duplicate waterings or certificates.                                                                                               |
| BR-08   | Volunteering is optional; declined tasks never remove waterings or incur a ranking penalty.                                                                                   |
| BR-09   | No student approves their own completion.                                                                                                                                     |
| BR-11   | AI recommendations are advisory; the student and organizer decide. Overrides require a logged reason.                                                                         |
| BR-12   | Only admin-approved templates may represent AIU as certificate issuer. For the demo, certificates are labeled as a prototype and not an official AIU document.                |
| BR-13   | A student's tree is visible only to that student.                                                                                                                             |

## 7. Data Model

| Entity            | Key fields (illustrative)                                                                                  | Constraints                                                       |
|-------------------|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| User              | id, auth_subject, role, display_name, consent_version                                                      | Unique auth_subject; soft deactivation                            |
| StudentProfile    | user_id, skills\[\], availability, matching_opt_out                                                        | Private by default                                                |
| Organization      | id, name, organizer_ids                                                                                    | Scoped permission boundary                                        |
| Mission           | id, organization_id, title, required_skills\[\], start, end, capacity, status, source (manual or ai_draft) | end later than start                                              |
| MissionAssignment | id, mission_id, student_id, status, applied_at, recommendation_id                                          | Unique active student+mission; capacity protected                 |
| Recommendation    | id, mission_id, student_id, score, factors (JSON), algorithm_version                                       | Stored for explainability and audit                               |
| Completion        | id, assignment_id, approved_by, status                                                                     | Unique approved completion per assignment                         |
| WateringLedger    | id, user_id, completion_id, delta, reason, idempotency_key                                                 | Unique idempotency key; revocations are new entries with a reason |
| Certificate       | id, completion_id, serial, pdf_path, template_version                                                      | Unique completion+template                                        |
| Notification      | id, user_id, type, payload, read_at                                                                        | Recipient only                                                    |
| AiUsageLog        | id, feature, model, version, prompt_hash, created_at                                                       | Feeds the declaration form                                        |
| OverrideLog       | id, actor_id, mission_id, reason                                                                           | Human override of AI ranking                                      |
| AuditEvent        | id, actor_id, entity, action, created_at                                                                   | Append-only                                                       |

Section 7 note: Reward tables are deferred with FR-017.

## 8. State Workflows

Mission: DRAFT to PUBLISHED to IN_PROGRESS to PENDING_VERIFICATION to COMPLETED. CANCELLED is allowed before completion with an audit entry and notification to affected students, with no penalty.

Assignment: APPLIED or INVITED to ACCEPTED to SUBMITTED to APPROVED or REJECTED. CHECKED_IN is added only if FR-016 is implemented.

Certificate issuance is triggered only by an APPROVED completion.

## 9. Responsible AI, Privacy and Ethics

This section is built into the product, not only documented, because the rubric asks for it to be shown in the demo.

- Law and policy: handle personal data in line with the Personal Data Protection Act 2010 (Malaysia) and the AIU code of conduct.

- Data: synthetic or anonymised data only. No real student, personal or biometric data without written consent. Survey responses are anonymous and voluntary.

- Consent: FR-025 consent screen with opt-out and stored consent version.

- Data minimization: the matching algorithm uses only declared skills, declared availability, existing assignment conflicts and optional coarse distance. It never uses grades, gender, nationality, religion or other protected or sensitive attributes, and never infers them.

- Explainability: every recommendation shows its factors (FR-007).

- Bias: FR-024 exposure balancing and cold-start rule; the evaluation (FR-026) reports spread of opportunities and any group differences found in synthetic data.

- Human control: BR-11 and OverrideLog.

- Generative AI limits: the LLM only drafts mission text for human review; it cannot publish, add waterings, issue certificates or contact students.

- Retention: evidence notes and survey data are deleted after the competition unless consent says otherwise.

- Declaration: every AI tool, model, public API, dataset and prompt used (including coding assistants used to build the project) is recorded for the declaration form. Undeclared tools or data sources can cost up to 10 points.

## 10. Matching Algorithm Contract

Stage 1: Filter out students with time conflicts, missing required eligibility, matching opt-out, or a full mission. Stage 2: Compute a transparent weighted score for the remaining students.

| Factor               | Starting weight | Notes                                                        |
|----------------------|-----------------|--------------------------------------------------------------|
| Skill alignment      | 35%             | Overlap with required skills                                 |
| Availability fit     | 30%             | Declared availability vs mission window                      |
| Opportunity balance  | 20%             | Higher for students with fewer recent opportunities (FR-024) |
| Optional proximity   | 10%             | Coarse only; omitted if unavailable                          |
| Verified reliability | 5%              | Neutral default for new students (cold-start)                |

Weights are starting values to be tuned on synthetic fixtures and discussed with an organizer. Omitted factors are re-normalized. The baseline for comparison is first-come-first-served. The final decision belongs to the student and the organizer.

## 11. Non-Functional Requirements

| ID     | Area            | Requirement                                                                                               |
|--------|-----------------|-----------------------------------------------------------------------------------------------------------|
| NFR-01 | Security        | Server-side role checks and row-level access rules.                                                       |
| NFR-02 | Privacy         | Data minimization, consent, no real records without written consent.                                      |
| NFR-03 | Performance     | Core pages usable on a mid-range Android; target under 3 seconds to meaningful render in test conditions. |
| NFR-04 | Realtime        | Approval changes appear within 5 seconds; refresh fallback if offline.                                    |
| NFR-05 | Accessibility   | Keyboard access, contrast, readable text, reduced motion, non-color-only status.                          |
| NFR-06 | Reliability     | Transactional watering issuance, idempotent retries, recoverable failed PDF generation.                   |
| NFR-07 | Integrity       | Append-only audit and ledger corrections.                                                                 |
| NFR-08 | Maintainability | Typed APIs, automated tests on core rules, reproducible setup and README.                                 |
| NFR-09 | Responsible AI  | Explainable factors, no protected-trait scoring, human override, no fabricated mission details.           |
| NFR-10 | Deployment      | HTTPS demo URL with demo accounts, no privileged credentials exposed, and a recorded fallback demo video. |
| NFR-11 | Retention       | Documented retention and deletion policy.                                                                 |

## 12. Threats and Edge Cases (Core Set)

| Case                                         | Expected behavior                                            |
|----------------------------------------------|--------------------------------------------------------------|
| Two students accept the final spot at once   | One accepted; the other receives a full or waitlist response |
| Overlapping mission                          | Rejected or flagged with explanation                         |
| Organizer approves twice                     | One watering entry and one certificate                       |
| Certificate PDF generation fails             | Approval persists; retry without duplicates                  |
| Student without history (cold start)         | Still recommended; no reliability penalty                    |
| LLM drafts wrong or missing details          | Organizer must review; blanks are flagged, never invented    |
| AI ranking conflicts with organizer judgment | Override allowed with logged reason                          |
| Student impersonates organizer               | Server-side RBAC rejects                                     |
| Notification delivery fails                  | In-app inbox retains the event                               |
| Mission cancelled after sign-up              | Students notified; no penalty                                |

## 13. API / Service Interfaces (Conceptual)

| Endpoint                       | Purpose                                    | Security                  |
|--------------------------------|--------------------------------------------|---------------------------|
| POST /missions/draft-from-text | LLM drafts a mission from pasted text      | Organizer                 |
| POST /missions                 | Create draft mission                       | Organizer scoped          |
| POST /missions/:id/publish     | Publish validated mission                  | Organizer or admin        |
| GET /missions/recommended      | Filtered, ranked missions with explanation | Signed-in student         |
| POST /missions/:id/accept      | Accept; transactional capacity check       | Student                   |
| POST /completions/:id/review   | Approve or reject attendance               | Organizer or admin        |
| POST /completions/:id/revoke   | Revoke an approval with a logged reason    | Admin                     |
| GET /certificates/:id/download | Download PDF                               | Owner or authorized staff |
| GET /evaluation/baseline       | Baseline comparison results                | Admin or demo             |

## 14. Demo Script (Acceptance Gate and 10-Minute Pitch Flow)

Seed: eight synthetic students, one organizer, one administrator.

1.  (Minute 0 to 2) Problem and evidence: named users, survey or interview finding, measurable outcome. Presenter A.

2.  (Minute 2 to 3) Consent screen and privacy approach shown. Presenter B.

3.  (Minute 3 to 4) Organizer pastes a messy announcement; the LLM drafts a mission; the organizer edits and publishes. Presenter C.

4.  (Minute 4 to 5) Recommended students appear with Why recommended; a conflicting and an unqualified student are excluded; an organizer override is logged. Presenter B.

5.  (Minute 5 to 6) Four students accept; a fifth concurrent request cannot exceed capacity. Presenter C.

6.  (Minute 6 to 7) Organizer approves one participation; the student sees the notification, the watering count rises once, the student's tree grows, and a certificate PDF with a unique serial downloads. Presenter A.

7.  (Minute 7 to 8) Repeat the approval request; watering and certificate counts stay unchanged.

8.  (Minute 8 to 9) Baseline evaluation: results against first-come-first-served, including honest trade-offs. Presenter B.

9.  (Minute 9 to 10) Feasibility, costs, pilot plan and next steps. Presenter A or C.

Every team member should present part of the pitch. Keep a recorded fallback video of steps 3 to 7.

## 15. Team Roles and 2-Day Plan (Submit Oct 29)

Roles (one person may hold several): team lead and backend, frontend and UX, AI and data engineer (matching, evaluation, LLM intake), pitch presenter and documentation. \[Assign names when the team is confirmed.\]

| When           | Deliverable                                                                                                                                                                                          |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Oct 27 (today) | Survey sent, organizer or management interview booked; repository, database, authentication, roles; seeded synthetic data and one canonical mission; AI usage log started                            |
| Oct 28         | Mission create and publish, LLM intake, matching with fairness balancing, accept with capacity lock, verification, watering ledger, certificate PDF, consent screen, baseline comparison, core tests |
| Oct 29 morning | Feature freeze; HTTPS deployment; fallback demo video; README, project summary, declaration form; evidence inserted                                                                                  |
| Oct 29         | Submit and test access from a clean browser                                                                                                                                                          |
| Nov 2          | Internal pitch rehearsal; Stretch items only if all MVP tests pass                                                                                                                                   |
| Nov 5          | Final polish and rehearsal if selected                                                                                                                                                               |

If time runs short, cut Should-have items first, never the end-to-end journey.

## 16. Feasibility, Sustainability and Next Steps

- Cost: prototype runs on free-tier hosting and a low-volume LLM API. \[Estimate the monthly cost at AIU scale.\]

- Stakeholder: \[name the student affairs, club or events office contact, or state that none is confirmed\].

- Pilot plan: (1) pilot with one student club event, (2) expand to one faculty with real consented data, (3) integrate with AIU single sign-on and official certificate templates.

- Risks: low organizer adoption (mitigate with fast mission intake), fairness weights contested (mitigate with documented tuning and override), data protection (mitigate with minimization and consent).

- Future work, clearly labeled: rewards and sponsorship (FR-017), logistics (FR-019), routing (FR-020), sponsored trips (FR-021), public verification (FR-022).

## 17. Competition Rubric Traceability

| Rubric criterion (points)             | Where this SRS addresses it        | Proof in the demo                                          |
|---------------------------------------|------------------------------------|------------------------------------------------------------|
| Problem relevance and impact (20)     | Section 1, evidence plan           | Named user, survey or interview result, metrics            |
| Technical execution (25)              | FR-001 to FR-011, tests, NFRs      | Full journey runs live; README and commit history          |
| Innovation and use of AI (15)         | FR-007, FR-023, FR-024, section 10 | LLM intake and explainable fair matching vs baseline       |
| Responsible AI, ethics, security (10) | Section 9, FR-025, BR-11, RBAC     | Consent screen, Why recommended, override log, idempotency |
| Feasibility and next steps (15)       | Section 16                         | Cost, pilot plan, risks                                    |
| Pitch, demo, teamwork (15)            | Sections 14 and 15                 | Timed script, each member presents, fallback video         |

### Required deliverables checklist

- Working solution on an HTTPS URL with demo accounts.

- Project summary (problem, users, solution, technology, impact, next steps).

- One-page declaration form listing AI tools, models, data sources and ethics notes (use AiUsageLog).

- Shared repository with commit history and a README (problem, solution, architecture, how to run, limitations).

- Final presentation within 10 minutes.

## 18. Open Items for the Team

- Replace every \[BRACKET\] placeholder with real findings.

- Confirm the Gemini model name and free-tier limits in Google AI Studio, and declare it.

- Confirm team members and assign a dedicated presenter.

- Tune and justify the matching weights on seeded data.

- Submission deadline is Oct 29; confirm the submission format and the Nov 2 and Nov 5 dates with the organizers.

End of Software Requirements Specification, Version 1.1
