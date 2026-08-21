# Phase 00 — The brief, the stack, and the rules

> **Group** Foundation · **Side** Both · **Risk** low (1/3) · **Depends on** —

**Goal.** What you are building, why every technology in the stack was chosen, and the working rules that decide whether this gets finished.

## The product

A multi-tenant SaaS for car rental agencies. An agency signs up, gets an isolated workspace, and manages its fleet, its customers and its bookings. One codebase, one database, many agencies who must never see each other's data. This is a commercial product shape, not an exercise — which is exactly why it interviews well.

## The system

```
  React 19 + TypeScript          Laravel 12 API            PostgreSQL 16
  ├ React Query (server state)   ├ Sanctum (tokens)        ├ daterange + GiST
  ├ Zod (runtime validation)  ─► ├ Policies + scopes   ─►  ├ exclusion constraint
  ├ React Hook Form              ├ Form Requests           └ partial indexes
  └ Vite build                   └ Queues ─► Redis
```

## Why each piece is there

- **PostgreSQL over MySQL.** Range types with exclusion constraints let the database itself make double-booking impossible. MySQL cannot do this. It is also the default in most modern European backend teams, and you already have MySQL on your CV — this shows range.
- **TypeScript over JavaScript.** The single biggest gap between your CV and European job ads. Retrofitting types onto a finished app is a job nobody actually does.
- **React Query over hand-rolled fetching.** Server state is not UI state. Caching, refetching, invalidation and race-condition handling are solved problems; writing them yourself in every hook is the mark of someone who hasn't worked on a real team.
- **Zod alongside TypeScript.** Types vanish at compile time. Zod is what catches the API actually sending you something different at runtime — and it generates the TypeScript type from the same schema, so they can't drift.
- **Docker Compose.** One command starts Postgres, Redis, PHP and Node at the versions you pinned. It ends "works on my machine" and it is on nearly every job ad.
- **Laravel API-only + separate SPA.** So a React Native client can reuse the same backend without a rewrite. The cost is roughly 40% more work than server-rendered Blade — accept it deliberately and be able to name it.

## What you are actually training

Three things, and every phase is scored against them. **Security** — can another tenant reach this data, and what happens when input is hostile. **Scalability** — what breaks at 500 agencies and 2 million rentals. **Optimisation** — how many queries, how many bytes, how many milliseconds. Junior portfolios never mention these. That absence is your opening.

## Working rules

- **One project for 90 days.** Other ideas go to `docs/ideas.md` and stay there.
- **You write every line.** AI reviews and explains; it does not generate. Code you cannot defend is worse than no code.
- **One branch per phase**, small commits, merged by pull request — including a pull request you review and merge yourself. The history is part of the portfolio.
- **Every non-obvious decision gets written down** the day you make it, in two sentences: what you chose, what you gave up.
- **The roadmap is allowed to be ahead of you.** You will not understand phase 15 today. You are not supposed to.

## Tasks

- [ ] Create `docs/ideas.md`, move every competing idea into it
- [ ] Commit to 90 days on this one project
- [ ] Fix your weekly build schedule around the 08:00–16:00 job
- [ ] Write the stack justification in your own words — one line per technology

## Done when

You can explain in 90 seconds, out loud in English, what the product is and why each technology in the stack is there — naming a cost for each choice, not only a benefit.

## What this teaches

| Area | Skill |
| --- | --- |
| Interview | Explaining your own projects — problem, decisions, trade-offs ★★★ |
| Architecture | Client–server architecture, REST principles ★★★ |
| Interview | Discussing trade-offs rather than absolutes |

## Interview questions

**Q. Why did you choose PostgreSQL for this?**

Because the core domain problem is overlapping date ranges. Postgres has native range types and exclusion constraints, so the database rejects an overlapping booking itself — no application lock required. MySQL has no equivalent, so there I would be relying on application-level locking alone.

**Q. Why an API instead of server-rendered pages?**

So a mobile client can reuse the same backend. It cost me roughly 40% more work and introduced CORS, token storage and duplicated validation — I accepted that deliberately for the mobile path.

## Search terms

- multi tenant saas architecture explained
- postgres vs mysql 2026
- why typescript over javascript
