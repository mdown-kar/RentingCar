# Phase 21 — Package it, then defend it

> **Group** The interview · **Side** Both · **Risk** low (1/3) · **Depends on** 20

**Goal.** The repository, the README, your profile and you — all able to present this without help, in English.

## README structure that actually gets read

- **One sentence** on what it is, then the live link and demo credentials — above everything else. A reviewer gives you thirty seconds.
- **Screenshots or a short GIF** immediately after: the booking flow, and the 409 conflict message.
- **The problem** — what rental agencies do today and why it fails.
- **The hard parts**, which is the section people actually read: availability over date ranges, the exclusion constraint, tenant isolation, the booking race. Two paragraphs each, with the numbers from phases 12 and 15.
- **Architecture** — the ERD, the request diagram, and a link to `docs/adr/`.
- **Scaling** — the ladder from phase 20, ending with 'not needed at current scale'.
- **Stack and local setup** — short, at the bottom, and ideally one command thanks to phase 02.
- **What v1 does not do, and why.** This is the section that makes you read as senior rather than unfinished.

## Profile

- Pin this alongside OptiNow, Markazi and the Charles Dickens platform. Four strong repositories beat twenty-five mixed ones.
- Description and topics: `laravel`, `react`, `typescript`, `postgresql`, `multi-tenancy`, `saas`.
- Archive anything named `test`, `test2` or `projet-final`.
- The commit history should read as a build log — small commits, real messages, feature branches merged by pull request. People do look.
- Update both CVs: PostgreSQL, TypeScript, Docker and CI/CD are all new lines you have now earned.

## The twelve answers, rehearsed out loud in English

- **What is it and who is it for?** — 60 seconds, no jargon.
- **How do you know a car is free?** — the anti-join, computed not stored, with the timing.
- **Two people book the last car at once.** — the exclusion constraint, 23P01, 409, the test, and the MySQL fallback.
- **How do tenants stay separated?** — scope plus policies, 404 not 403, and why you rejected row-level security.
- **Why PostgreSQL?** — range types and exclusion constraints, and what MySQL would have cost you.
- **Why TypeScript and Zod together?** — compile-time versus runtime, one schema, no drift.
- **Walk me through your security.** — the layered answer from phase 09.
- **What did you optimise, and by how much?** — three before-and-after numbers.
- **What do you test and what do you not?** — your rules, not the framework.
- **How does it scale?** — the ladder, ending in 'measure first'.
- **What was the hardest bug?** — pick a real one; the race, or the global scope failing in a queued job.
- **What would you do differently?** — have a genuine answer. Row-level security from the start is a good one.

## How to rehearse

Say each answer out loud, in English, standing up, without notes, and record it once. Listening back is unpleasant and it is the fastest correction available — you will hear the filler, the hedging, and the places where you do not actually know. Three passes and you will be fluent. Written answers you have never spoken collapse under a follow-up question.

## Two things to say that most candidates never do

- **Name what your solution does not cover** before you are asked. The exclusion constraint is single-database. The scoping is application-level. Volunteering limits reads as confidence, not weakness.
- **Say 'I don't know, but here is how I would find out.'** Interviewers probe until they find the edge; how you behave at that edge is most of what they are measuring. Guessing confidently is the failure mode.

## Then v2, one branch at a time

Reporting and revenue, maintenance and damage records, PDF contracts, online payment, customer self-service, a React Native client, row-level security. All deliberately cut from v1 — which is exactly why v1 got finished. Each one is a branch in the same repository, and each one is another paragraph in the README.

## Warning

> Do not start applying the week you deploy. Rehearse first. A live link with a candidate who cannot explain their own concurrency handling is worse than no link — it invites exactly the questions you have not prepared for.

## Tasks

- [ ] Write the README with all eight sections
- [ ] Screenshots and a booking GIF
- [ ] Commit the ERD and request diagram
- [ ] Pin the repo, set topics, clean the profile
- [ ] Add PostgreSQL, TypeScript, Docker and CI to both CVs
- [ ] Write out all twelve answers
- [ ] Rehearse each one out loud in English
- [ ] Record yourself once and listen back
- [ ] Practise drawing the ERD from memory on paper
- [ ] Plan v2 in `docs/ideas.md`
- [ ] **Then** start applying

## Done when

You can talk through this project for ten minutes, out loud in English, with no notes — and answer a follow-up on availability, concurrency or isolation without opening the code.

## What this teaches

| Area | Skill |
| --- | --- |
| Interview | Explaining your own projects — problem, decisions, trade-offs ★★★ |
| Interview | Whiteboarding a data model or architecture ★★★ |
| Interview | Discussing trade-offs rather than absolutes ★★★ |
| Interview | Thinking out loud while coding ★★★ |
| Interview | "I don't know, but here's how I'd find out" ★★★ |
| Interview | Technical English — fluency under follow-up questions ★★★ |
| Git | Pull requests and review etiquette |

## Interview questions

**Q. Tell me about a project you're proud of.**

A multi-tenant SaaS for car rental agencies — Laravel API, React and TypeScript client, PostgreSQL. The interesting problem is availability over date ranges, and specifically preventing double bookings. I solved it with a Postgres exclusion constraint, so overlaps are rejected by the database rather than by my application code, with transactions and locking as a second layer. It's live, it has a test suite and a CI pipeline, and the architectural decisions are documented as ADRs in the repo.

**Q. What was the hardest thing?**

Understanding that check-then-act isn't atomic. My first version checked availability and then inserted, which looks correct and is wrong under concurrency. Once I could see the shape of that bug I found it in several other places — and I learned there are exactly three ways to close it: a constraint, a lock, or an atomic operation.

**Q. What would you do differently?**

Row-level security from the start. I enforce tenant isolation in the application with global scopes and policies, which works and is tested, but the guarantee lives in code I wrote rather than in the database. RLS would make it structural. I chose against it for operational simplicity and I'd revisit that decision at larger scale.

## Search terms

- explaining projects technical interview
- system design interview junior
- github profile readme developer
- technical english interview practice
