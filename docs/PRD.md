# Voluntree: Product Requirements Document (PRD)

## Fair, Explainable Volunteer Matching and Verified Recognition for AIU

Version: 1.1 (aligned with SRS v1.1 and the MMC Upstart 2026 rubric) Status: Baseline for a 2-day build Date: 27 October 2026 Competition: MMC Upstart 2026 Catalyst: Igniting Future Innovation, AIU Alor Setar Focus area: 02 Smart Campus and Institutional Systems (secondary: community engagement)

Assumptions note: AIU deployment, sponsorship, certificate branding and institutional approval are NOT confirmed. All demo data is synthetic. Items in \[BRACKETS\] must be replaced with real findings before submission and must not be presented as facts.

## 1. Executive Summary

Voluntree is a mobile-first web app (PWA) that helps AIU event organizers fill volunteer slots fairly and quickly, and gives students verified recognition for their service. An organizer pastes a messy event announcement; an AI model drafts a structured mission for the organizer to confirm. A transparent matching engine recommends students who fit the mission, explains why, and balances opportunities so the same few students are not always chosen. After the event, the organizer verifies attendance; the system adds exactly one watering to the student's tree and issues a PDF Certificate of Appreciation.

Primary innovation: explainable, fairness-aware matching with human control, plus LLM-assisted mission intake, delivered as one auditable workflow and evaluated against a first-come-first-served baseline. The growing tree is a visual record of each student's verified volunteering, not the technical core.

## 2. Problem and Evidence

### 2.1 Problem statement

AIU campus events rely on student volunteers recruited through group chats, posters and forms. Hypothesized consequences: the same few students get most opportunities, organizers spend time chasing and verifying volunteers, and students seldom receive verified recognition. \[Insert one finding: survey result, organizer or management quote, or cited source.\]

### 2.2 Named users

| User                        | Need                                                                  | Evidence to gather                                                                                 |
|-----------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Student volunteer (primary) | Find suitable opportunities fairly; get verified recognition          | Survey: how they find volunteering, whether opportunities feel fair, whether they get certificates |
| Event organizer (primary)   | Fill slots with suitable people; verify attendance with little effort | Interview: current process, time spent, no-show experience                                         |
| Administrator (secondary)   | See verified impact and audit actions                                 | Management interview or desk research                                                              |

Community partners are removed from the MVP and listed as future work.

### 2.3 Evidence plan (fallback ladder)

1.  Preferred: anonymous, voluntary survey of 20 or more AIU students (3 to 5 questions). Send it today; close it on the morning of Oct 29.

2.  If not enough responses: interview one organizer, club or the management office, with permission, and record the pain points.

3.  Last resort: cited desk research. State plainly in the pitch that primary evidence was not collected.

## 3. Goals and Non-Goals

Goals:

- G-01: Demonstrate one complete journey: mission intake, matching, acceptance, verification, watering and certificate.

- G-02: Make matching more relevant, more transparent and more evenly distributed than first-come-first-served, and prove it with numbers.

- G-03: Issue a PDF Certificate of Appreciation for every verified volunteer, with no duplicates.

- G-04: Show responsible AI inside the product: consent, explanations, human override and no sensitive attributes.

- G-05: Report measurable results, not assumed ones.

Non-goals for the MVP: app-store distribution, payments, real vouchers or trips, AIU single sign-on, autonomous allocation decisions, route optimization, partner portals, learned prediction models.

## 4. Personas and Roles

| Role      | Responsibilities                                                       | Key permissions                            |
|-----------|------------------------------------------------------------------------|--------------------------------------------|
| Student   | Browse and accept missions, receive notifications and certificates     | Own profile, assignments, certificates     |
| Organizer | Create and publish missions, review recommendations, verify attendance | Own organization's missions and applicants |
| Admin     | Oversight, audit, overrides                                            | Cross-mission read and audited overrides   |

## 5. Core User Journey (the demo)

1.  Student logs in with a demo account and sees a plain-language consent and privacy screen with an option to opt out of matching.

2.  Organizer pastes an event announcement. The LLM drafts a structured mission; the organizer edits and publishes. The draft is labeled AI-generated and nothing is published automatically.

3.  The matching engine removes students with time conflicts or missing eligibility, then ranks the rest with a transparent score that includes an opportunity-balance factor. Each recommendation shows Why recommended.

4.  Students accept voluntarily. Capacity is enforced even for simultaneous requests.

5.  After the event, the organizer approves attendance. One watering is recorded exactly once and a PDF certificate with a unique ID is generated. The student sees the update on screen, including their tree growing.

6.  A baseline comparison page shows Voluntree vs first-come-first-served on the seeded dataset.

## 6. Feature Prioritization (2-Day Scope)

| Capability                 | MVP (must work live by Oct 29)                                                                                    | Stretch (before Nov 2 or Nov 5 if selected)                  | Future (label as future work)                                  |
|----------------------------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|----------------------------------------------------------------|
| Identity and roles         | Demo login, student, organizer and admin roles, server-side checks                                                | Profile editing                                              | AIU single sign-on                                             |
| Mission flow               | Create, publish, accept, verify, complete                                                                         | Withdrawal cutoff, full lifecycle states                     | Recurring schedules                                            |
| AI: matching               | Hard filters, transparent score, Why recommended, exposure balancing, cold-start rule                             | Organizer override log in the UI                             | Learned models, evaluated fairness at scale                    |
| AI: mission intake         | LLM draft with mandatory human review                                                                             | Dedupe and validation hints                                  | Multilingual intake                                            |
| Baseline evaluation        | Script or page comparing against first-come-first-served                                                          | Charts in the dashboard                                      | Live A/B pilot                                                 |
| Responsible AI             | Consent screen, opt-out, no sensitive attributes, AI usage log                                                    | Fairness report page                                         | Independent audit                                              |
| Waterings and certificates | One watering per approval, PDF with unique ID, idempotent approval, admin revocation with reason, five-stage tree | None                                                         | Public certificate verification, institutional signing         |
| Dashboards                 | Basic organizer counters (applicants, approved participations)                                                    | Admin audit view                                             | Advanced analytics                                             |
| Notifications              | On-screen update after approval                                                                                   | In-app inbox                                                 | Push notifications                                             |
| Rewards and logistics      | Not in MVP                                                                                                        | Simulated staff-approved voucher; one batch staffing example | Real vendor, sponsor and trip integrations, route optimization |
| Anti-fraud                 | Duplicate-approval protection                                                                                     | One-use QR check-in                                          | Risk scoring                                                   |

Rule: if time runs out, cut stretch items first. Never cut the end-to-end journey.

## 7. Critical Product Policies

- Every verified volunteer receives one Certificate of Appreciation per qualifying mission, regardless of watering count or rank.

- Waterings are lifetime, non-transferable and never spent.

- Volunteering is optional. Assignments are invitations. Declining carries no penalty.

- AI recommendations are advisory. Students and organizers decide; overrides need a logged reason.

- No AIU branding or signature is claimed without authorization. Demo certificates carry a prototype watermark.

- Student data (skills, availability, history) is private by default. A student's tree is visible only to that student.

- The LLM may only draft mission text for human review. It cannot publish, add waterings, issue certificates or contact students.

- The tree never penalizes inactivity. It shrinks only when an admin revokes a mistaken or fraudulent approval, with a logged reason.

## 8. Responsible AI, Privacy and Security

- Law and policy: follow the Personal Data Protection Act 2010 (Malaysia) and the AIU code of conduct.

- Data: synthetic or anonymised only. No real student, personal or biometric data without written consent. Survey answers are anonymous and voluntary.

- Consent: plain-language consent screen with opt-out, consent version stored per user.

- Minimization and bias: the matcher uses only declared skills, declared availability, schedule conflicts and optional coarse distance. It never uses grades, gender, nationality, religion or other sensitive traits. Exposure balancing and a cold-start rule protect newcomers.

- Explainability: every recommendation lists the factors that produced it.

- Security: server-side role checks, row-level access, idempotent watering and certificate issuance, audit of approvals.

- Declaration: every AI tool, model, public API, dataset and prompt used in the product and in building it (including coding assistants) is logged for the one-page declaration form. Undeclared tools or data can cost up to 10 points.

## 9. Success Metrics

### 9.1 Product outcome metrics (measured on seeded data, targets not claimed results)

| Metric                      | Definition                                                 | Baseline                                       | Target                     |
|-----------------------------|------------------------------------------------------------|------------------------------------------------|----------------------------|
| Skill-matched fill rate     | Share of slots filled by students who meet required skills | \[measure for first-come-first-served\]        | Higher than baseline       |
| Opportunity spread          | Gap or Gini of opportunities per student                   | \[measure\]                                    | More even than baseline    |
| Time conflicts offered      | Recommendations that overlap a student's commitments       | \[measure\]                                    | Zero                       |
| Organizer verification time | Time to approve a volunteer and issue a certificate        | \[timed manual process or interview estimate\] | Under 1 minute in the demo |

### 9.2 System correctness metrics

| Metric                                                    | Target                                                    |
|-----------------------------------------------------------|-----------------------------------------------------------|
| End-to-end completion across scripted demo cases          | 100%                                                      |
| Duplicate watering or certificate after repeated approval | 0                                                         |
| Mandatory eligibility respected in recommendations        | 100%                                                      |
| Certificate data matches the approved record              | All tested certificates valid                             |
| Screen update after approval                              | Within 5 seconds on a test network, with refresh fallback |

Report the baseline comparison honestly, including any case where the baseline performs better.

## 10. Delivery Plan (Real Dates)

| When                       | Work                                                                                                                                                                                                                                                            | Owner      |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| Oct 27 (today)             | Send survey and book an organizer or management interview. Set up repository, database, authentication, roles. Seed 8 or more synthetic students, one organizer, one admin, one canonical event mission. Start the AI usage log.                                | \[Assign\] |
| Oct 28                     | Mission create and publish, LLM intake, matching with explanation and exposure balancing, accept with capacity lock, verification, watering ledger, certificate PDF, consent screen, baseline comparison. Tests for matching filters, idempotency and capacity. | \[Assign\] |
| Oct 29 morning             | Freeze features. Deploy over HTTPS with demo accounts. Record a fallback demo video. Write README, project summary and declaration form. Insert survey or interview evidence.                                                                                   | \[Assign\] |
| Oct 29                     | Submit project, project summary and declaration form. Verify access links work from a clean browser.                                                                                                                                                            | \[Assign\] |
| Nov 2 (internal pitch)     | Rehearse the 10-minute pitch with every member speaking. Add stretch items only if all MVP tests pass.                                                                                                                                                          | \[Assign\] |
| Nov 5 (final, if selected) | Polish explanations and reliability, rehearse timing, prepare answers to judge questions.                                                                                                                                                                       | \[Assign\] |

Verify these dates with the organizers when they are announced. The competition guideline lists date and registration details as to be announced.

## 11. Risks and Responses

| Risk                             | Response                                                                                                                                                               |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Only 2 days to build             | Build only the single journey. Cut stretch items. Use Supabase or a similar hosted backend for authentication and database, and a PDF library rather than custom code. |
| Problem not validated at AIU     | Run the evidence ladder in section 2.3 and label any gap openly.                                                                                                       |
| LLM errors or invented details   | Human review is mandatory; blank unknown fields; log model and prompt. Provide a manual form as fallback.                                                              |
| Algorithmic exclusion            | Explanations, opt-out, exposure balancing, cold-start rule, human override.                                                                                            |
| Demo failure on the day          | Fallback video and resettable synthetic accounts.                                                                                                                      |
| Sensitive data                   | Synthetic accounts only; written consent for anything real.                                                                                                            |
| Inaccurate certificate authority | Prototype watermark unless AIU authorizes a template.                                                                                                                  |
| Reward budget and cheating       | Rewards are not in MVP; any later version needs caps, independent verification and audit logs.                                                                         |

## 12. Feasibility and Next Steps

- Cost: prototype uses free-tier hosting and a low-volume LLM API. \[Estimate monthly cost at AIU scale.\]

- Stakeholder: \[name the student affairs, club or events office contact, or state that none is confirmed\].

- Pilot: (1) one club event with real, consented volunteers; (2) one faculty; (3) AIU single sign-on and official certificate template.

- Sustainability: little organizer overhead, since mission intake and certificates are automated; low hosting cost.

- Future work, clearly labeled: rewards and sponsorship, logistics batching, route optimization, sponsored trips, public certificate verification, partner portal.

## 13. Decisions Needing Institutional Validation

- Who may publish official missions and approve completion at AIU?

- Who may issue certificates?

- Which student identifiers may be used?

- Are any prizes pre-funded, or only simulated?

- May public certificate verification exist, and what may it reveal?

These are future-work questions. The MVP does not depend on any of them.

## 14. Rubric Alignment and Pitch Plan

| Criterion (points)                    | What proves it                                                                   | Where in the demo                        |
|---------------------------------------|----------------------------------------------------------------------------------|------------------------------------------|
| Problem relevance and impact (20)     | Named users, survey or interview finding, baseline metrics                       | Opening 2 minutes                        |
| Technical execution (25)              | Live end-to-end journey, tests, README, commit history                           | Minutes 3 to 7                           |
| Innovation and AI (15)                | LLM intake and explainable fair matching vs baseline                             | Minutes 3 to 5 and 8                     |
| Responsible AI, ethics, security (10) | Consent screen, Why recommended, override, idempotent approval, declaration form | Throughout, explicitly at minute 2 and 7 |
| Feasibility and next steps (15)       | Cost, pilot plan, risks                                                          | Final minute                             |
| Pitch, demo, teamwork (15)            | Timed 10-minute script, every member presents, fallback video                    | Whole pitch                              |

Submission checklist: working solution on HTTPS, project summary, one-page declaration form, repository with README and commit history, final presentation.

References: MMC Upstart 2026 Catalyst: Igniting Future Innovation, Theme, Guidelines and Judging Rubric (provided PDF), pages 2 to 6. All operational pain points are hypotheses until validated at AIU.

End of PRD Version 1.1
