# Phase 08 — Multi-tenancy — isolation that cannot be forgotten

> **Group** Identity & isolation · **Side** API · **Risk** high (3/3) · **Depends on** 07

**Goal.** Every query is automatically scoped to the caller's agency, enforced by two independent mechanisms, and proven by tests.

## Name it correctly

**Shared database, shared schema multi-tenancy with row-level scoping.** Use that phrase. The alternatives are a database per tenant (strong isolation, painful migrations, expensive at scale) and a schema per tenant (a middle ground Postgres supports well). You chose shared-schema for operational simplicity, and the cost is that isolation now depends on application code being correct — which is exactly why this phase has two layers and a test suite.

## Layer one — the global scope

- An `AgencyScope` implementing `Scope`, added in each model's `booted()` method, appending `where agency_id = ?` to every query automatically.
- **Scope writes as well as reads.** Set `agency_id` on the `creating` event in the same place. Scoping reads but not writes is half a solution and a real vulnerability — a forged `agency_id` in a request body would otherwise plant a row in someone else's account.
- For `rentals`, which deliberately has no `agency_id`, scope through the relationship: `whereHas('car', fn($q) => $q->where('agency_id', ...))`. This is the cost you accepted for a normalised schema — write it in the ADR.
- **The classic failure:** a global scope depends on `auth()->user()`. In a queued job, a console command, a seeder or a scheduled task there is no authenticated user, so the scope either silently returns nothing or throws. Decide the behaviour explicitly — usually: throw loudly unless a tenant has been set deliberately — and document it.

## Layer two — policies

A policy per model, so that even if a record escapes a query, *acting* on it is still refused. Two independent mechanisms means a single bug is not a breach. This is defence in depth, and being able to say those words about your own code is worth more than the code itself.

## 404, not 403 — and why

When agency A requests agency B's car, return **404 Not Found**. A 403 confirms the record exists, which leaks information across a tenant boundary: an attacker can enumerate IDs and learn how many cars a competitor holds. Within your own tenant, 403 is the right answer for a permission failure. The distinction is subtle, deliberate, and exactly the kind of thing a senior interviewer probes.

## What to test — these are the most important tests in the project

- A cannot **read** B's car, customer or rental — 404 on each.
- A cannot **update** or **delete** B's records — 404, and the record is unchanged afterwards.
- A cannot **create** a record into B's agency by putting `agency_id` in the request body — the value is ignored and the row lands in A.
- A cannot **book B's car** — availability queries and the booking endpoint are both scoped.
- List endpoints return only A's rows when both tenants hold similar data.
- Write these as a reusable Pest dataset so every new resource inherits the whole suite for one line of code.

## The stronger option, and why you're not using it

Postgres supports **row-level security** — policies enforced by the database itself, so even raw SQL cannot cross tenants. It is genuinely stronger than application scoping. It also complicates connection pooling, migrations and debugging, and it fights Eloquent. Know it exists, be able to describe it, and say you evaluated it and chose application-level scoping with policies for operational simplicity. That answer lands far better than not knowing the option.

## Warning

> Test isolation with **three** tenants, not two. With two, a bug that returns 'everything except mine' looks identical to correct behaviour in half your assertions.

## Tasks

- [ ] Write `AgencyScope` and register it on every tenant model
- [ ] Set `agency_id` on the creating event
- [ ] Keep `agency_id` out of `$fillable`
- [ ] Scope rentals through the car relationship
- [ ] Decide and document behaviour without an authenticated user
- [ ] A policy per model
- [ ] Write the full cross-tenant test dataset
- [ ] Test the forged `agency_id` case explicitly
- [ ] Write the multi-tenancy ADR including the RLS option you rejected

## Done when

Logged in as agency A, every attempt to touch agency B's data returns 404 — reading, writing, deleting, booking and forging `agency_id` in the body — with automated tests proving each one against three seeded tenants.

## What this teaches

| Area | Skill |
| --- | --- |
| Architecture | Multi-tenancy patterns and their trade-offs ★★★ |
| Architecture | Defence in depth ★★★ |
| Architecture | Separation of concerns ★★★ |
| Laravel | Global scopes and model events ★★★ |
| Laravel | Policies, gates, authorization ★★★ |
| Laravel | Mass assignment protection ★★★ |
| Web | Insecure direct object references (IDOR) ★★★ |
| Web | Status codes — when 404 beats 403 ★★★ |
| SQL | Row-level security in Postgres |
| Testing | Datasets and reusable test suites |

## Interview questions

**Q. How do agencies stay separated?**

Shared database, shared schema, with row-level scoping. A global scope filters every query by the authenticated user's agency and sets the tenant on create, and policies independently authorise every action — so one bug isn't a breach. Cross-tenant access returns 404 rather than 403, because 403 would confirm the record exists.

**Q. What would you do differently at larger scale?**

Move to Postgres row-level security, so the guarantee lives in the database rather than in Eloquent. I didn't start there because it complicates pooling and migrations, and at this size application scoping plus policies plus tests was the better trade.

**Q. What is IDOR?**

Insecure direct object reference — exposing a record by ID without checking the caller may see it. Changing /cars/12 to /cars/13 and getting another tenant's car is the canonical case. Scoping and policies close it; returning 404 stops it leaking existence.

## Search terms

- laravel multi tenancy global scope
- postgres row level security
- idor vulnerability explained
- laravel policies tutorial
