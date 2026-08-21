# Build specification

Car Rental SaaS — multi-tenant, production-grade. 22 phases in 9 groups.
Generated from the HTML build spec. The HTML files stay in `docs/spec/html/` as the
readable dashboard with progress tracking; these markdown files are the same content
in a form that is cheap to read and greppable.

Regenerate after editing the HTML:

```sh
node tools/spec-to-markdown.mjs docs/spec/html docs/spec
```

| Phase | Title | Group | Side | Risk | Depends on |
| --- | --- | --- | --- | --- | --- |
| 00 | [The brief, the stack, and the rules](phase-00-foundation.md) | Foundation | Both | low | — |
| 01 | [Repository, documentation and architecture decision records](phase-01-foundation.md) | Foundation | Both | low | 00 |
| 02 | [Docker Compose — the whole environment in one command](phase-02-foundation.md) | Foundation | Infra | medium | 01 |
| 03 | [Laravel API skeleton with static analysis from commit one](phase-03-foundation.md) | Foundation | API | low | 02 |
| 04 | [React 19 + TypeScript, typed end to end](phase-04-foundation.md) | Foundation | Client | medium | 03 |
| 05 | [PostgreSQL schema — types, keys and constraints that carry meaning](phase-05-data.md) | Data layer | API | medium | 04 |
| 06 | [The exclusion constraint — making double-booking physically impossible](phase-06-data.md) | Data layer | API | high | 05 |
| 07 | [Authentication with Sanctum, typed on both sides](phase-07-identity.md) | Identity & isolation | Both | medium | 04, 05 |
| 08 | [Multi-tenancy — isolation that cannot be forgotten](phase-08-identity.md) | Identity & isolation | API | high | 07 |
| 09 | [Security hardening across the whole surface](phase-09-identity.md) | Identity & isolation | API | medium | 08 |
| 10 | [Fleet management, end to end and fully typed](phase-10-resources.md) | Resources | Both | medium | 09 |
| 11 | [Customers, and fuzzy search in Postgres](phase-11-resources.md) | Resources | Both | medium | 10 |
| 12 | [Availability — the query the whole product exists to answer](phase-12-domain-core.md) | The domain core | API | high | 06, 10 |
| 13 | [The booking lifecycle](phase-13-domain-core.md) | The domain core | Both | high | 12 |
| 14 | [Transactions, locking and the race you already prevented](phase-14-domain-core.md) | The domain core | API | high | 06, 13 |
| 15 | [Optimisation with numbers, not instincts](phase-15-performance.md) | Performance | Both | high | 13 |
| 16 | [Testing what would hurt if it broke](phase-16-confidence.md) | Confidence | Both | medium | 14, 15 |
| 17 | [Continuous integration — the pipeline that says no](phase-17-confidence.md) | Confidence | Infra | medium | 16 |
| 18 | [Observability — knowing what production is doing](phase-18-confidence.md) | Confidence | API | medium | 17 |
| 19 | [Queues and background work](phase-19-production.md) | Production | API | medium | 14, 18 |
| 20 | [Deploy, and know how it scales](phase-20-production.md) | Production | Infra | high | 17, 19 |
| 21 | [Package it, then defend it](phase-21-interview.md) | The interview | Both | low | 20 |

