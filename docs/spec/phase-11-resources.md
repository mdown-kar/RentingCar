# Phase 11 — Customers, and fuzzy search in Postgres

> **Group** Resources · **Side** Both · **Risk** medium (2/3) · **Depends on** 10

**Goal.** The same vertical slice, faster — plus real search that tolerates the way names are actually typed at a counter.

## Repetition is the point

Resource controller, form requests, per-agency unique CIN instead of plate, scoped queries, typed hooks, list and form screens. If this does not go noticeably faster than the fleet, you did not fully absorb phase 10 — go back rather than pushing forward. Speed on the second repetition is the honest measure of whether the first one taught you anything.

## Search that survives real input

A counter agent types `mohamed` and the record says `Mohammed`. A `LIKE '%mohamed%'` query returns nothing, and it cannot use an index either — it scans the whole table. Postgres solves both problems, and this is a genuinely impressive thing to have in a portfolio project.

## Two tools, different jobs

- **`pg_trgm` — trigram similarity.** Splits text into three-character sequences and measures overlap, so misspellings still match. Backed by a GIN index, so it stays fast. This is what you want for names.
- **Full-text search** — `tsvector` and `tsquery`, with stemming and ranking. Right for prose, overkill for a name field.
- For this project: trigram similarity on name, exact match on CIN and phone, combined and ordered by score.
- Store the trigram index on a generated column combining the searchable fields, so one index serves the whole query.

## The query

```
SELECT *, similarity(name, :term) AS score
FROM customers
WHERE agency_id = :agency
  AND (name % :term OR cin = :term OR phone = :term)
ORDER BY score DESC
LIMIT 20;

-- % is the trigram similarity operator, threshold-controlled
CREATE INDEX customers_name_trgm
  ON customers USING gin (name gin_trgm_ops);
```

## Client side

- **Debounce the input.** Without it you fire a request per keystroke. Write the debounce hook yourself — it is a classic interview exercise and takes ten minutes.
- React Query **deduplicates and cancels** superseded requests, which is what stops results from an earlier keystroke arriving after a later one and overwriting them. Understand that this race exists and that the library is handling it.
- `keepPreviousData` so the list does not flash empty between keystrokes.
- Show the search term in the empty state — 'No customers match "mohamed"' with a create button, not a blank panel.

## Personal data has rules

You are storing names, national ID numbers and phone numbers. Under GDPR that is personal data, and Morocco's Law 09-08 imposes broadly similar duties. You do not need a compliance programme for a portfolio project — but a short `docs/data-protection.md` noting what you store, why, how long you keep it, and how a customer could be deleted or exported, is the kind of thing that makes a European hiring manager sit up. Almost no junior portfolio has considered it.

## Warning

> Measure the search on the large seed from phase 05, not on thirty rows. Run `EXPLAIN ANALYZE` and confirm the GIN index is actually being used — a similarity query that falls back to a sequential scan is fast at demo size and unusable at real size.

## Tasks

- [ ] Customer resource with per-agency unique CIN
- [ ] Enable `pg_trgm` and add the GIN index
- [ ] Combined similarity and exact-match search scope
- [ ] Write `useDebounce` by hand
- [ ] Search hook with `keepPreviousData`
- [ ] Useful empty state naming the search term
- [ ] `EXPLAIN ANALYZE` on the large seed
- [ ] Write `docs/data-protection.md`
- [ ] Compare your elapsed time against phase 10 honestly

## Done when

Typing a misspelt name into the search box finds the right customer in under 100ms against hundreds of thousands of seeded rows, with `EXPLAIN ANALYZE` confirming the index is used — and this phase took clearly less time than the fleet did.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | Trigram similarity, pg_trgm, GIN indexes ★★★ |
| SQL | Full-text search — tsvector, tsquery |
| SQL | EXPLAIN ANALYZE — reading a query plan ★★★ |
| SQL | Generated columns |
| Laravel | Query scopes ★★★ |
| JavaScript | Debounce and throttle — written by hand ★★★ |
| React | Custom hooks — useDebounce ★★★ |
| React | Race conditions in data fetching ★★★ |
| Architecture | Data protection, GDPR basics |

## Interview questions

**Q. How does your search handle misspellings?**

Trigram similarity in Postgres. pg_trgm breaks the text into three-character sequences and scores the overlap, so 'mohamed' still matches 'Mohammed'. It's backed by a GIN index, so unlike LIKE '%term%' it doesn't force a sequential scan.

**Q. Search races — an early request returning after a later one. How do you handle it?**

React Query keys each request by its parameters and discards responses that are no longer current, so a stale keystroke can't overwrite a newer result. Hand-rolled, I'd track a request ID or use an AbortController in a useEffect cleanup.

**Q. Why debounce rather than search on every keystroke?**

Each keystroke is a database query and a network round trip. Debouncing at around 300ms cuts a ten-letter name from ten queries to one, with no perceptible delay for the user.

## Search terms

- postgres pg_trgm fuzzy search
- postgres full text search tutorial
- react usedebounce hook typescript
- explain analyze postgres
