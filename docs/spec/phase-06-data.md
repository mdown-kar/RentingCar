# Phase 06 — The exclusion constraint — making double-booking physically impossible

> **Group** Data layer · **Side** API · **Risk** high (3/3) · **Depends on** 05

**Goal.** Push the core business rule into PostgreSQL so that no application bug, no race condition and no manual query can ever create two overlapping rentals on one car.

## Why this phase exists

Every booking system has the same bug waiting in it. Two requests arrive at almost the same moment for the same car and overlapping dates. Both check availability. Both see the car free — because neither has inserted yet. Both insert. You now hold two rentals on one car and nothing raised an error. The gap between checking and writing is the entire problem, and it cannot be closed by checking more carefully.

## The three levels of answer

- **Junior:** "I check availability before inserting." This is the bug, described confidently.
- **Mid:** "I wrap the check and the insert in a transaction and lock the rows." Correct, and what you'd have to do on MySQL. You will still implement this in phase 15 as defence in depth.
- **Senior:** "The database has an exclusion constraint on the range, so an overlap is rejected regardless of what the application does." This is why the stack chose Postgres.

## The constraint

```
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE rentals
  ADD CONSTRAINT rentals_no_overlap
  EXCLUDE USING gist (
    car_id WITH =,          -- same car
    period WITH &&          -- overlapping period
  )
  WHERE (status IN ('reserved', 'ongoing'));
```

## Reading that out loud

- **`EXCLUDE USING gist`** — reject any new row that conflicts with an existing one, using a GiST index to find conflicts fast.
- **`car_id WITH =`** — rows only conflict if they concern the same car.
- **`period WITH &&`** — `&&` is the range overlap operator. This is the rule you would otherwise write by hand as `start <= other_end AND end >= other_start`.
- **`btree_gist`** — the extension that lets a plain equality column (`car_id`) sit inside a GiST index next to a range.
- **The `WHERE` clause** makes it a *partial* exclusion constraint: cancelled and returned rentals are excluded, so a cancelled booking stops blocking the dates. Forget this clause and cancelled rentals hold cars hostage forever.

## Understand the range bounds before you trust it

`daterange` defaults to `[)` — start inclusive, end exclusive. A rental of `[2026-09-01, 2026-09-05)` occupies the 1st through the 4th, and a new rental starting on the 5th does **not** overlap. That is almost always what a rental business wants: one car returned in the morning goes out again the same afternoon. Decide it consciously, write it in an ADR, and be ready to explain the alternative.

## Prove all five cases by hand

```
existing:  |--------|
before:                |----|     ok
after:     |----|                 ok
inside:      |----|               rejected
contains: |------------|          rejected
crossing:      |---------|        rejected
touching:  |----|                 ok   ← the [) boundary
```

## Getting it into Laravel

- Schema builder cannot express this — use `DB::statement()` inside the migration, with a matching `down()` that drops the constraint.
- A violation surfaces as a `QueryException` carrying SQLSTATE **23P01** (exclusion violation). Catch that specific code — never catch every `QueryException` and assume it was an overlap.
- Translate it into a clean **409 Conflict** with a message the counter agent can act on: which car, which dates, and what is still free.
- Write the test now: insert one rental, attempt an overlapping one, assert the 409. It's three lines and it is the most valuable test in the project.

## Know the limits of your own solution

State them before you're asked. The constraint protects a single table in a single database — it does not extend across services or shards. It cannot express a buffer period on its own (a car needing two hours of cleaning between rentals means widening the stored range or adding a trigger). And it is Postgres-specific: on MySQL you would fall back to transactions plus row locks, which is why phase 15 still exists.

## Warning

> Do not skip straight to writing this. Draw the six cases on paper first and satisfy yourself that `&&` handles every one of them. If you cannot explain the constraint without reading it, you cannot defend it in an interview — and this is the single answer most likely to get you hired.

## Tasks

- [ ] Draw all six overlap cases on paper
- [ ] Enable `btree_gist` in a migration
- [ ] Write the exclusion constraint with the partial `WHERE`
- [ ] Write a reversing `down()`
- [ ] Verify every case by hand in `psql`
- [ ] Catch SQLSTATE 23P01 and map it to 409
- [ ] Write the overlapping-insert test
- [ ] Record the bound choice and the limits in an ADR

## Done when

With the API stopped, you open `psql` and try to insert an overlapping rental by hand — Postgres refuses it. You can then explain, from memory, what each line of the constraint does.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | Range types and the overlap operator ★★★ |
| SQL | Exclusion constraints, GiST indexes ★★★ |
| SQL | Constraints as the last line of defence ★★★ |
| SQL | Isolation levels and what constraints guarantee that locks don't |
| Web | 409 Conflict — when it's the right status ★★★ |
| Interview | Explaining a hard problem you solved ★★★ |
| Architecture | Pushing invariants down the stack |

## Interview questions

**Q. Two people book the last car at the same instant. What happens?**

One insert succeeds and the other is rejected by an exclusion constraint on the rental period, which returns SQLSTATE 23P01. I map that to a 409 with the free alternatives. It holds regardless of application-level races because the guarantee lives in the database, not in my controller.

**Q. Why not just check availability first?**

Because checking and writing aren't atomic. Both requests can read "free" before either writes. Any check-then-act pattern has that window — you close it with a constraint or a lock, not with a more careful check.

**Q. What does this approach not cover?**

It's scoped to one table in one database, so it wouldn't survive sharding or a split across services. It also can't express a cleaning buffer by itself. And it's Postgres-only, so on MySQL I'd need transactions with SELECT FOR UPDATE instead.

## Search terms

- postgres exclusion constraint tutorial
- postgres range types daterange
- btree_gist extension
- prevent double booking database
