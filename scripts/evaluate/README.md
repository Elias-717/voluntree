# Baseline evaluation (FR-026)

This folder compares Voluntree's matching engine (`src/lib/matching/`, DEC-036, unchanged) with a first-come-first-served (FCFS) baseline on **synthetic data only**. The main question is **fairness**: are volunteering opportunities spread more evenly, and do new volunteers get a chance?

It evaluates **two configurations** of the same synthetic scenario: the **live configuration** (the app as it runs now, the primary result) and a **future configuration** (once students can choose skills and declare availability). The latest results are in [`results.md`](./results.md). That file is generated, so don't edit it by hand.

**These are synthetic results. They show how the methods behave under the stated assumptions; they are not real-world validation and don't prove that Voluntree is fair for real students.**

## Run it

```bash
npm run evaluate
```

This runs both configurations, prints the report and rewrites `results.md`. The output is identical, byte for byte, on every run. (`npm run evaluate` runs `tsx scripts/evaluate/run.ts`; `.gitattributes` keeps `results.md` at LF line endings, DEC-045.)

Tests:

```bash
npx vitest run scripts/evaluate
```

One test fails if `results.md` no longer matches a fresh run. That's a reminder to re-run the script after changing anything here.

## The idea in one sentence

Both methods get exactly the same students, missions, interest, eligibility rules and capacity. **The only difference is the order in which the interested, eligible students receive the slots**: FCFS uses arrival order, Voluntree uses the engine's ranking.

## Two configurations (`applyConfiguration` in `generate.ts`)

Both configurations start from **the same generated scenario**: the same students, missions, history, school, CGPA, capacity, interest and arrival times. The configuration is applied on top as a copy. Within each configuration, Voluntree and FCFS get exactly the same inputs; results from the two configurations are reported in separate parts and never mixed.

| | **Live configuration (Part A, primary)** | **Future configuration (Part B)** |
|---|---|---|
| What it models | the app as it runs now (DEC-048) | students who can choose skills and declare availability |
| Mission required skills | none (`requiredSkills: []`) | 1–2 per mission |
| Availability matching sees | none (`availability: []`), so matching excludes no one for availability | the declared windows; matching excludes students whose windows don't cover the mission |
| Who can take a mission | students who want it **and can attend it**: self-selection, not a matching filter. A student's synthetic windows must cover the mission; students who never entered any count as free | students who want it and pass matching's availability filter (the same windows, the same rule) |
| Reliability | none for everyone (`reliability: null`): the neutral 0.5, as in the app today | from the synthetic history |
| **Weights in effect** (DEC-036 base weights 35 / 20 / 10 / 5, unchanged; proximity is never available) | **opportunity balance 20/25 (80%), reliability 5/25 (20%)** | **skill 35/60 (58.3%), opportunity balance 20/60 (33.3%), reliability 5/60 (8.3%)** |
| Not applicable | skill-matched placements, mean skill alignment, mean reliability of placed students | — |

**How the live ranking really works.** The weights read 80% opportunity balance and 20% reliability, but reliability is the same 0.5 for everyone, so it adds the same amount to every score. **The ranking is therefore decided by opportunity balance alone**: fewest approved participations first, with equal counts falling back to the student ID.

**Why ability to attend is self-selection.** DEC-048 removed declared availability from the app: students accept only missions they can attend. So in the live configuration matching sees no availability, and the synthetic windows are used only to decide which interested students would actually accept. That is the same rule the future configuration applies through matching, so **both configurations have the same eligible-and-interested population** (the coverage denominator), and FCFS-random gets identical results in both.

**Not every demo record.** The live configuration models students with no declared skills. The seeded demo students in the database do have skills, and some seeded missions list skills; the simulation doesn't represent those records. (If students have no skills, a mission's skill list gives every student the same 0 and doesn't change the ranking, so missions that list skills are still covered.)

## Synthetic scenario (`generate.ts`)

All numbers come from one seeded generator (`random.ts`, mulberry32), seed **20261028**. Every student and mission uses a fixed number of random draws, so the equal-history variant differs from the main one only in its starting history.

**100 students**

| Field | Rule (synthetic assumption) |
|---|---|
| School | SBSS 25%, SEHS 20%, SCI 25%, CFGS 15%, LC 15% |
| CGPA | 10% none; otherwise uniform 2.00–4.00 |
| Skills | 1–3 of 8 skills (first aid, tutoring, registration desk, social media, event setup, logistics, photography, translation) |
| **Historical approved participations** | deliberately uneven: 40% have 0, 30% have 1–2, 20% have 3–5, 10% have 6–12 |
| Reliability | none (new volunteer) when the history is 0; otherwise 0.60–1.00 |
| Availability | 15% never entered (unknown); the rest declare 2–4 of the 5 days, one window per day (start 08:00–12:00, end 13:00–18:00) |
| Proximity | not provided, because the database has no proximity column |

**20 missions**
- **Schedule:** 4 per day on 2–6 November 2026, each 2–4 hours between 08:00 and 18:00. Some missions on the same day overlap.
- **Skills and capacity:** 1–2 required skills, and a capacity of 3–8.
- **Gated missions:** exactly 5 (25%), with eligible schools, a minimum CGPA of 3.00, or both. 2 of them also need dean approval.

**Interest:** each student wants each mission with probability **0.35**. The table is fixed before any allocation and shared by all methods.

**Arrival order** (FCFS only): a random 0–1 score per student and mission, highest first.
- **FCFS-random**, the primary baseline, uses the score as it is.
- **FCFS-engaged**, a sensitivity check only, adds a small head start of **0.05 per past participation, capped at 0.25**. It models experienced students signing up a little faster.

## Simulation rules (`allocate.ts`)

The same rules apply to every method:

1. **Order:** missions are allocated one at a time, in start-time order (ties broken by ID), at each mission's start time.
2. **Candidate pool:** the students who want the mission and pass the engine's own Stage 1 filters *right now*. That means no time conflict with a mission they already got, availability (`FULL`, or `UNKNOWN`, which is accepted; in the live configuration everyone is `UNKNOWN`, and ability to attend was already applied to interest), school, minimum CGPA, and capacity. Because the filters are the engine's, the rules are identical for every method.
3. **Placement:**
   - **Voluntree** places the first `capacity` students in the engine's ranking.
   - **FCFS** places the first `capacity` students in arrival order.
4. **Commitments:** a placed student gets a commitment immediately, so any overlapping later mission is blocked.
5. **Approvals:** they count towards the student's all-time approved participations (`recentOpportunities`, DEC-036) only once the mission has finished, i.e. from missions starting at or after its end.
   - Because missions are allocated at their start time, a mission that hasn't finished yet always overlaps the current one, and its students are excluded for the time conflict anyway.
   - So this rule gives the same results as counting approvals at placement. It would only matter if missions were allocated earlier.
6. **History stays separate:** historical participations are never changed. New placements are counted separately, and the engine sees history + approved new placements.

**Pools can differ between methods.** The first mission's candidate pool is identical for every method. After that, the pools can differ, because each method's earlier placements create different time conflicts. The report shows each gated mission's pool at allocation time for each method.

## Metrics (`metrics.ts`)

Unless a metric says "combined", it counts **new simulated placements only**.

| Metric | Definition |
|---|---|
| Gini | values sorted ascending, i = 1…n: `G = 2·Σ i·xᵢ / (n·Σ xᵢ) − (n+1)/n`; 0 when nobody has anything. 0 = perfectly even |
| Max–min gap | largest minus smallest count |
| Combined Gini / gap | the same, on history + new placements |
| New-volunteer inclusion | of the students with history 0, the share with at least 1 new placement |
| Coverage | of the students who were interested in, and eligible for, at least one mission **before any allocation**, the share with at least 1 placement. This denominator doesn't depend on any method |
| Supplementary Gini | the Gini of new placements among that same eligible-and-interested population only. It leaves out students who never had a chance, and uses the same students for every method. The all-student Gini is kept |
| Supplementary new-volunteer inclusion | of the students in that population with 0 historical participations, the share with at least 1 placement, shown with the exact numerator and denominator. The all-student version is kept |
| Gated pools | per gated mission: criteria-eligible students (school/CGPA only, whatever their interest), initial candidates (interested, eligible and available at the start), and the pool at allocation for each method. Overall: Gini and coverage of gated placements among students in any gated mission's initial candidate pool |
| Skill-matched placements | placements where the student has at least 1 required skill (SRS §1.3), plus the mean skill-alignment value. Future configuration only |
| Slot fill rate | placements ÷ total capacity |
| Time conflicts | pairs of one student's placements that overlap. **0 for both methods is the correct result**: both follow the overlap rule of `accept_mission` |
| Trade-offs | mean reliability of placed students (new volunteers count as 0.5; future configuration only), new placements of the 10% most experienced students, new placements per school, and distributions |

**Verdicts are computed from the numbers, never written by hand.**
- A difference counts as "Equal" when it is within **0.005** for 0–1 indexes or **0.5 percentage points** for percentages; whole-number counts must match exactly.
- Every "Equal" or "FCFS better" row is listed automatically under "Where FCFS-random is equal or better", separately for each configuration.
- Rows that mean nothing in the live configuration are shown as **Not applicable**, with no verdict, and are left out of its robustness counts and lists.

## Robustness checks

Both checks run for both configurations:
- **10 more seeds** (20261029–20261038): the same settings, summarised as minimum, mean and maximum differences, and the number of seeds won, tied and lost. This shows the main seed wasn't hand-picked.
- **Equal history:** the same seed, but everyone starts with 0 participations. This tests what Voluntree does when there is no existing inequality to correct.

## Assumptions and limitations

| # | Assumption |
|---|---|
| A1 | No students opt out of matching |
| A2 | Deans approve every pending request |
| A3 | Everyone placed attends and is approved; no-shows aren't modelled and reliability doesn't change |
| A4 | Students with unknown availability are free and attend |
| A5 | Interest is random: it doesn't depend on history **or on skills** |
| A6 | Missions are allocated one at a time, in start-time order |
| A7 | Live configuration: students accept only missions their synthetic availability covers (self-selection, DEC-048), and the app has no reliability or skill data for them |

What these assumptions mean for the results:
- **This is a synthetic model.** It shows how the methods behave under these assumptions. It is **not** evidence about real AIU students.
- **Skill results (future configuration) are likely overstated.** Because interest ignores skills (A5), FCFS often places students without the required skills. Real students may prefer missions that match their skills, so Voluntree's lead on the skill metrics is partly a result of A5.
- **Live ties are broken by student ID.** With reliability constant, students with the same number of approved participations are ordered by ID. That is repeatable but arbitrary; in the app, IDs are random UUIDs.
- **Self-selection depends on synthetic availability (A7).** Real students may misjudge whether they can attend.
- **Gated pools are small**, often no larger than the number of slots, so the order of selection rarely matters there. Gated results are close, and FCFS is better on several seeds.
- **The Gini of new placements stays high for every method.** It covers all 100 students, including those who wanted no mission they could take.
- **Weights actually used:** the database has no proximity data, so the engine always leaves the proximity factor out and re-normalizes the unchanged DEC-036 base weights (35 / 20 / 10 / 5). Live: **opportunity balance 80%, reliability 20%** (constant). Future: **skill 58.3%, opportunity balance 33.3%, reliability 8.3%**.

## Files

| File | Purpose |
|---|---|
| `random.ts` | seeded random numbers |
| `generate.ts` | synthetic students, missions, interest and arrival orders; `applyConfiguration` for the live and future configurations |
| `allocate.ts` | the shared simulation for Voluntree, FCFS-random and FCFS-engaged |
| `metrics.ts` | Gini, gap, coverage, gated pools and the supporting metrics |
| `report.ts` | verdicts and the Markdown report |
| `run.ts` | entry point: runs both configurations and writes `results.md` |
| `*.test.ts` | Vitest tests for all of the above |
