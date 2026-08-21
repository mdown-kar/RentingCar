# Phase 05 — PostgreSQL schema — types, keys and constraints that carry meaning

> **Group** Data layer · **Side** API · **Risk** medium (2/3) · **Depends on** 04

**Goal.** A schema where invalid data is rejected by the database, not merely discouraged by the application.

## The principle

Application code is one bug away from writing nonsense. A constraint is not. Every rule you can push down into the schema is a rule that survives a careless controller, a bad migration script, someone using `psql` directly, and any future developer who hasn't read your code. Push down everything you can.

## Tables, in dependency order

```
agencies    id · name · slug(UK) · logo · address · ice · settings(jsonb)
users       id · agency_id(FK) · name · email(UK) · password · role · ...
cars        id · agency_id(FK) · plate_number · model · fuel_type
            year · daily_price(numeric 10,2) · condition · status
customers   id · agency_id(FK) · name · cin · address · email · phone
rentals     id · car_id(FK) · customer_id(FK) · period(daterange)
            returned_at(nullable) · price(numeric 10,2) · status
```

## Postgres types you should use here

- **`daterange` for the rental period** instead of two separate date columns. One value, one index, and it unlocks the exclusion constraint in the next phase. Use the `[)` bound — inclusive start, exclusive end — so a return on the 5th and a pickup on the 5th do not collide.
- **`numeric(10,2)` for money.** Never `float`, never `double`. Binary floating point cannot represent 0.10 exactly, and money that drifts is money you'll be asked about.
- **Native `enum` types** for rental status and fuel type. The database refuses an invalid value outright.
- **`jsonb` for agency settings** — genuinely schemaless preferences, indexable with GIN. Note `jsonb`, not `json`: it's parsed, compact and queryable.
- **`timestamptz`, never `timestamp`.** Store in UTC, render in the user's zone. Getting this wrong is invisible until a daylight-saving boundary.

## Constraints worth writing

- `UNIQUE (agency_id, plate_number)` — a plate is unique *within* an agency. Two agencies may legitimately hold the same plate; a global unique index would be a bug that only appears on your second customer.
- Same shape for `(agency_id, cin)` on customers.
- `CHECK (daily_price > 0)` and `CHECK (price >= 0)`.
- `CHECK (upper(period) > lower(period))` — a rental cannot end before it starts.
- Foreign keys with deliberate `ON DELETE` behaviour: `CASCADE` from agency to its own data, `RESTRICT` from car to rentals. A rental with no car is corrupt history.

## Indexes, chosen not sprinkled

- `agency_id` on every tenant-owned table — every single query filters on it.
- A **GiST** index on `rentals(car_id, period)`. B-tree cannot answer range overlap; GiST is what makes availability fast and what the exclusion constraint uses.
- A **partial index** on active rentals only — `WHERE status IN ('reserved','ongoing')`. Most queries only ever ask about active ones, and the index stays small forever while the table grows.
- Every index costs write time and disk. Add one when a query plan asks for it, and be able to say which query each index serves.

## Seed data that resembles production

- **Three** agencies, not one. You cannot test isolation with a single tenant, and two makes some bugs symmetrical and invisible.
- Rentals spread across past, present and future, including some in progress and some returned late.
- A performance seeder producing hundreds of thousands of rentals. Phases 13 and 16 are meaningless on twenty rows — every query is fast on twenty rows.
- Moroccan plates, real Tangier addresses, MAD prices. Demo data that looks real makes the whole project look real.

## Warning

> Never edit a migration that has already run on a server. Locally `migrate:fresh` is fine. Once deployed, changes are new migrations, forward only — and every migration needs a `down()` that genuinely reverses it.

## Tasks

- [ ] Write every migration in dependency order
- [ ] Use daterange, numeric, enum, jsonb and timestamptz correctly
- [ ] Add all CHECK and composite UNIQUE constraints
- [ ] Deliberate ON DELETE behaviour on each foreign key
- [ ] GiST index on `(car_id, period)`
- [ ] Partial index on active rentals
- [ ] Factories for every model
- [ ] Seeder with three realistic agencies
- [ ] Separate performance seeder — hundreds of thousands of rentals
- [ ] Try to insert invalid data by hand and confirm rejection

## Done when

You can open `psql`, attempt to insert a negative price, a reversed date range, and a duplicate plate inside one agency — and the database refuses all three without any application code running.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | Data types and choosing them deliberately ★★★ |
| SQL | Primary keys, foreign keys, constraints ★★★ |
| SQL | Normalization 1NF–3NF, and when to denormalize ★★★ |
| SQL | Indexes — B-tree, GiST, partial, composite ★★★ |
| SQL | CHECK constraints, enums, generated columns |
| SQL | SQL injection and parameterised queries ★★★ |
| Laravel | Migrations, seeders, factories ★★★ |
| Architecture | Data integrity at the database layer |

## Interview questions

**Q. Why numeric instead of float for money?**

Floating point can't represent most decimal fractions exactly, so arithmetic drifts. numeric is exact decimal — slower, and correct. For money that trade is never close.

**Q. What is a partial index and when would you use one?**

An index with a WHERE clause, covering only rows that match. Here, only active rentals — the query pattern only ever asks about those, so the index stays small even as the table grows into millions of historical rows.

**Q. Why unique per agency instead of globally?**

Because the plate belongs to the tenant, not the system. A global unique constraint means the second agency to register a common plate gets a confusing error about a car they can't see — which is also an information leak.

## Search terms

- postgres data types explained
- postgres gist index range
- partial index postgres
- numeric vs float money database
- laravel migrations postgres
