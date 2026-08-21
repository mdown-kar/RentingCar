# Phase 15 — Optimisation with numbers, not instincts

> **Group** Performance · **Side** Both · **Risk** high (3/3) · **Depends on** 13

**Goal.** Find the real bottlenecks by measuring, fix them, and be able to quote before-and-after figures.

## Measure first, always

Every optimisation in this phase starts with a number and ends with a different number. Guessing where the time goes is how people spend a week making something 2% faster while the actual problem sits untouched. Write the before figure in the ADR before you change anything — that discipline is what separates engineering from tinkering, and quoting both numbers in an interview is far more convincing than describing a technique.

## Kill N+1 deliberately

- Load the rentals list with car and customer. Watch the query count explode with Laravel Debugbar or `DB::listen`.
- Add `with(['car','customer'])` and watch it collapse to three queries.
- Then set a **query budget**: `Model::preventLazyLoading()` in non-production throws the moment lazy loading happens. Now N+1 is a test failure rather than something you notice in production six months later.
- Understand why `with()` issues a second query with `WHERE id IN (...)` rather than a join — and when a join would actually be better.

## Read the plans

- `EXPLAIN ANALYZE` on the availability query, the rentals list and the customer search, all against the large seed.
- Learn to spot the three things that matter: a **sequential scan** on a large table, a row estimate far from the actual count, and a sort that spills to disk.
- A wrong estimate usually means stale statistics — `ANALYZE` the table and look again.
- Add an index only when a plan asks for it, and be able to name the query each index serves. Unused indexes cost write throughput and disk for nothing.

## Pagination that survives scale

`OFFSET 100000` makes the database walk and discard a hundred thousand rows. It is fine on page two and unusable on page two thousand. **Cursor pagination** — `WHERE id < :last ORDER BY id DESC LIMIT 20` — is constant time at any depth, and it does not skip or duplicate rows when data is inserted while the user is paging. Laravel gives you `cursorPaginate()`. Use offset pagination where the user needs page numbers, cursor pagination for infinite lists, and know why you chose each.

## Caching, with the hard part named

- Cache what is expensive and rarely changes: agency settings, dashboard counts, reference data. Redis is already running from phase 02.
- **Invalidation is the hard part.** Prefer short TTLs over clever invalidation when the data can tolerate being slightly stale — a dashboard count that is 60 seconds old is fine, and it needs no invalidation logic at all.
- **Tag caches by tenant.** A cache key without `agency_id` in it is a cross-tenant data leak — a real one, and a spectacular way to fail the isolation you built in phase 08.
- **Do not cache availability.** It changes on every booking and being wrong is worse than being slow. Know which data can be stale and which cannot; that judgement is the actual skill.
- Add a hit-rate metric. A cache you cannot measure is a cache you cannot tune.

## Frontend performance

- **Route-based code splitting** with `React.lazy` and `Suspense`. The login page should not ship the booking calendar.
- Run `vite build` with the bundle visualiser and look at what is actually large — it is usually one date library or icon set imported wholesale.
- **Virtualise long lists** only if you have one. Rendering 5,000 rows is slow; rendering the 20 that are visible is not.
- Memoise deliberately, not reflexively. `useMemo` on a cheap computation costs more than it saves, and React 19's compiler handles much of this — know what it does before adding manual memoisation.
- Measure with Lighthouse and record the before-and-after.

## Database connection handling

Each PHP-FPM worker holds its own connection, so concurrency at the web tier multiplies into connections at the database. Postgres handles far fewer connections comfortably than people assume, and the standard answer is a pooler — PgBouncer in transaction mode. You do not need it at your scale. Knowing the ceiling exists, and naming the fix, is the part that matters.

## Warning

> Do not optimise anything you have not measured, and do not add an index, a cache or a memo without a number showing it helped. Half of a senior engineer's value is refusing to make things more complicated for no gain.

## Tasks

- [ ] Reproduce N+1 and record the query counts
- [ ] Fix with eager loading, enable `preventLazyLoading`
- [ ] `EXPLAIN ANALYZE` the three heaviest endpoints
- [ ] Remove any index no query needs
- [ ] Switch infinite lists to `cursorPaginate`
- [ ] Cache agency settings and dashboard counts, tagged per tenant
- [ ] Verify every cache key contains `agency_id`
- [ ] Route-based code splitting
- [ ] Run the bundle visualiser and cut the largest offender
- [ ] Lighthouse before and after
- [ ] Write every before-and-after number into the ADR

## Done when

You can quote three before-and-after numbers from memory — query count, query time, bundle size — and every index and cache in the project maps to a specific query you can name.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | N+1 and eager loading ★★★ |
| SQL | EXPLAIN ANALYZE — sequential scans, estimates, sorts ★★★ |
| SQL | Index strategy, covering indexes, unused indexes ★★★ |
| SQL | Cursor vs offset pagination ★★★ |
| SQL | Connection pooling |
| Laravel | Eager loading, preventLazyLoading ★★★ |
| Laravel | Cache drivers, tags, TTL strategy ★★★ |
| React | Code splitting, React.lazy, Suspense ★★★ |
| React | useMemo, useCallback — and when not to ★★★ |
| React | List virtualisation |
| JavaScript | Bundle analysis, tree shaking ★★★ |
| Architecture | Measure, change, measure again ★★★ |

## Interview questions

**Q. How did you find the performance problems?**

By measuring. Query counts through Debugbar, EXPLAIN ANALYZE on the three heaviest endpoints against a 400,000-row seed, and Lighthouse on the client. The rentals list was 60-plus queries from N+1 and became three with eager loading; I then turned on preventLazyLoading so a regression fails a test rather than reaching production.

**Q. What do you cache, and what don't you?**

Agency settings and dashboard counts, keyed per tenant with a short TTL. Not availability — it changes on every booking and stale availability is worse than a slightly slower query. Every cache key includes agency_id, because a key without it is a cross-tenant leak.

**Q. Why is OFFSET pagination a problem?**

The database walks and discards every skipped row, so page two thousand costs two thousand pages of work. It also skips or repeats rows when data changes mid-paging. Cursor pagination is constant time and stable — I use it for infinite lists and keep offset only where the UI genuinely needs page numbers.

## Search terms

- laravel n+1 preventLazyLoading
- explain analyze reading query plans
- cursor pagination vs offset
- redis caching strategies ttl
- react code splitting lazy suspense
- vite bundle analyzer
