# Baseline evaluation (FR-026)

This folder compares Voluntree's matching engine (`src/lib/matching/`, DEC-036, unchanged) with a first-come-first-served (FCFS) baseline on **synthetic data only**. The main question is **fairness**: are volunteering opportunities spread more evenly, and do new volunteers get a chance?

The latest results are in [`results.md`](./results.md). That file is generated, so don't edit it by hand.

## Run it

```bash
npx tsx scripts/evaluate/run.ts
```

This prints the report and rewrites `results.md`. The output is identical on every run.

- **The final command will be `npm run evaluate`.** That needs Elias to add `tsx` as a dev dependency and this npm script: `"evaluate": "tsx scripts/evaluate/run.ts"`.
- **Until then,** `npx -y tsx …` fetches `tsx` into the npm cache without changing the project.

Tests:

```bash
npx vitest run scripts/evaluate
```

One test fails if `results.md` no longer matches a fresh run. That's a reminder to re-run the script after changing anything here.

## The idea in one sentence

Both methods get exactly the same students, missions, interest, eligibility rules and capacity. **The only difference is the order in which the interested, eligible students receive the slots**: FCFS uses arrival order, Voluntree uses the engine's ranking.

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
2. **Candidate pool:** the students who want the mission and pass the engine's own Stage 1 filters *right now*. That means no time conflict with a mission they already got, availability (`FULL`, or `UNKNOWN`, which is accepted), school, minimum CGPA, and capacity. Because the filters are the engine's, the rules are identical for every method.
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
| Skill-matched placements | placements where the student has at least 1 required skill (SRS §1.3), plus the mean skill-alignment value |
| Slot fill rate | placements ÷ total capacity |
| Time conflicts | pairs of one student's placements that overlap. **0 for both methods is the correct result**: both follow the overlap rule of `accept_mission` |
| Trade-offs | mean reliability of placed students (new volunteers count as 0.5), new placements of the 10% most experienced students, new placements per school, and distributions |

**Verdicts are computed from the numbers, never written by hand.**
- A difference counts as "Equal" when it is within **0.005** for 0–1 indexes or **0.5 percentage points** for percentages; whole-number counts must match exactly.
- Every "Equal" or "FCFS better" row is listed automatically under "Where FCFS-random is equal or better".

## Robustness checks

- **10 more seeds** (20261029–20261038): the same settings, summarised as minimum, mean and maximum differences, and the number of seeds won, tied and lost. This shows the main seed wasn't hand-picked.
- **Equal history:** the same seed, but everyone starts with 0 participations. This tests what Voluntree does when there is no existing inequality to correct.

## Assumptions and limitations

| # | Assumption |
|---|---|
| A1 | No students opt out of matching |
| A2 | Deans approve every pending request |
| A3 | Everyone placed attends and is approved; no-shows aren't modelled and reliability doesn't change |
| A4 | Students with unknown availability confirm and attend |
| A5 | Interest is random: it doesn't depend on history **or on skills** |
| A6 | Missions are allocated one at a time, in start-time order |

What these assumptions mean for the results:
- **This is a synthetic model.** It shows how the methods behave under these assumptions. It is **not** evidence about real AIU students.
- **Skill results are likely overstated.** Because interest ignores skills (A5), FCFS often places students without the required skills. Real students may prefer missions that match their skills, so Voluntree's lead on the skill metrics is partly a result of A5.
- **Gated pools are small**, often no larger than the number of slots, so the order of selection rarely matters there. Gated results are close, and FCFS is better on several seeds.
- **The Gini of new placements stays high for every method.** It covers all 100 students, including those who wanted no mission they could take.
- **Weights actually used:** the database has no proximity data, so the engine leaves the proximity factor out and re-normalizes. The weights in effect are **skill 35/60 (58.3%), opportunity balance 20/60 (33.3%) and reliability 5/60 (8.3%)**. The DEC-036 base weights (35 / 20 / 10 / 5) are unchanged.

## Files

| File | Purpose |
|---|---|
| `random.ts` | seeded random numbers |
| `generate.ts` | synthetic students, missions, interest and arrival orders |
| `allocate.ts` | the shared simulation for Voluntree, FCFS-random and FCFS-engaged |
| `metrics.ts` | Gini, gap, coverage, gated pools and the supporting metrics |
| `report.ts` | verdicts and the Markdown report |
| `run.ts` | entry point: runs everything and writes `results.md` |
| `*.test.ts` | Vitest tests for all of the above |
