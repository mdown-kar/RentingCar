# Phase 12 — Availability — the query the whole product exists to answer

> **Group** The domain core · **Side** API · **Risk** high (3/3) · **Depends on** 06, 10

**Goal.** Given a date range, return exactly the cars that are free, computed from stored rentals and fast at real data volume.

## The rule, stated once

A car is unavailable for a requested range if it has any active rental whose period overlaps that range. In Postgres that is one operator: `&&`. Written by hand it is `existing.start < requested.end AND existing.end > requested.start` — and the reason those are strict comparisons is the `[)` bound you chose in phase 06. Convince yourself of that on paper before writing a line.

## The query

```
SELECT c.*
FROM cars c
WHERE c.agency_id = :agency
  AND c.status = 'active'
  AND NOT EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.car_id = c.id
          AND r.status IN ('reserved','ongoing')
          AND r.period && :requested        -- daterange overlap
      );
```

## Why NOT EXISTS and not LEFT JOIN ... IS NULL

Both are correct. `NOT EXISTS` stops at the first matching rental instead of building the full join and discarding rows, and on Postgres it plans as an anti-join that uses your GiST index directly. Run both through `EXPLAIN ANALYZE` on the large seed and read the two plans side by side — this single comparison teaches more about query planning than a week of reading.

## Everything that is easy to get wrong

- **Cancelled and returned rentals must not block.** That is the status filter, and it is the same predicate as your partial exclusion constraint. If the two ever disagree, availability and the constraint disagree — keep them in one place.
- **Editing must exclude itself.** Re-checking availability while editing rental 42 has to ignore rental 42, or the booking collides with its own dates. Pass an optional `excludeRentalId` through the service.
- **Archived cars are not available.** The soft delete from phase 10 has to appear in this predicate.
- **Buffer time.** A car returned at 14:00 realistically cannot leave at 14:00. Decide whether v1 has a buffer — either answer is defensible — and if it does, widen the stored range rather than special-casing the query, so the exclusion constraint enforces it too.
- **Validate the range before querying.** A reversed or absent range must fail with 422, not silently match nothing.
- **Time zones.** Dates come from the client as strings. Parse them in the agency's zone, store UTC. A booking that shifts by a day at a daylight-saving boundary is a bug you will find months later.

## Where the code lives

An `AvailabilityService`, injected through the container — not inline in a controller. It is called by the availability endpoint, the booking endpoint, the edit endpoint, and later by reporting. A controller that calls a service and returns a resource is the shape you are aiming for; a controller holding eighty lines of query building is what you are avoiding. This is also where dependency injection stops being an abstract idea, because in phase 17 you will fake this service in tests.

## The endpoint

```
GET /api/v1/cars/available?from=2026-09-01&to=2026-09-05
     → 200  the free cars, paginated
     → 422  missing, malformed or reversed range
```

## Then measure it

- Run it against the large seed from phase 05 — hundreds of thousands of rentals.
- `EXPLAIN ANALYZE` and confirm the GiST index on `(car_id, period)` is used. If you see a sequential scan, find out why before moving on.
- Note the timing in the ADR. "This query runs in 8ms across 400,000 rentals, and here is the plan" is a sentence that ends an interview well.
- Then try it with the index dropped, and note that timing too. Knowing the magnitude of the difference is the point.

## Warning

> This is the phase to slow down on. If you take a shortcut anywhere in this project, not here. Availability is the one part that cannot be lifted from a tutorial, and it is what every technical interviewer will dig into.

## Tasks

- [ ] Re-draw the overlap cases and confirm the `[)` reasoning
- [ ] Write `AvailabilityService` with constructor injection
- [ ] Share the active-status predicate with the exclusion constraint
- [ ] Support `excludeRentalId` for edits
- [ ] Exclude archived cars
- [ ] Decide and document buffer time
- [ ] Validate the range, 422 on reversed or missing
- [ ] Build the availability endpoint
- [ ] `EXPLAIN ANALYZE` on the large seed, both with and without the index
- [ ] Record both timings in the ADR

## Done when

You can draw the six overlap cases from memory, explain why the comparisons are strict, and show an `EXPLAIN ANALYZE` plan proving the index is used at scale.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | Range overlap and the && operator ★★★ |
| SQL | EXISTS, NOT EXISTS, anti-joins ★★★ |
| SQL | JOINs — INNER, LEFT, and when each is right ★★★ |
| SQL | EXPLAIN ANALYZE — reading a query plan ★★★ |
| SQL | Index selection and why the planner ignores one |
| Laravel | Service classes, dependency injection ★★★ |
| Laravel | The service container ★★★ |
| Architecture | When to extract a service ★★★ |
| Web | Time zones — storing UTC, rendering local ★★★ |

## Interview questions

**Q. How do you determine whether a car is free?**

A NOT EXISTS anti-join against active rentals using the daterange overlap operator, filtered by tenant. It's computed from the rentals themselves — there's no is_available flag, because a stored boolean is a second source of truth that will eventually disagree with the bookings.

**Q. Why not store an availability flag and keep it updated?**

Because every write path would have to maintain it correctly — booking, editing, cancelling, returning, and any manual fix — and one missed path corrupts it silently. Deriving it is always consistent, and with a GiST index it's fast enough that caching isn't needed at this scale.

**Q. How fast is that query?**

Around 8ms across 400,000 rentals on the seeded dataset, using the GiST index on car_id and period. Without the index the same query does a sequential scan and takes over a second — I measured both.

## Search terms

- postgres explain analyze tutorial
- exists vs join performance postgres
- laravel service class dependency injection
- utc timezone best practices api
