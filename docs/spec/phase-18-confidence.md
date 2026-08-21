# Phase 18 — Observability — knowing what production is doing

> **Group** Confidence · **Side** API · **Risk** medium (2/3) · **Depends on** 17

**Goal.** When something breaks at 02:00, you can find out what, for whom, and why — without guessing.

## Why this belongs in a portfolio project

Almost no junior project has it, and every production system needs it. Being able to say "I log structured JSON with a request ID, errors go to Sentry with tenant context, and there is a health endpoint the load balancer reads" places you immediately in a different category. It is also not much work — perhaps two evenings — for a disproportionate amount of signal.

## Structured logging

- **JSON, not plain text.** Machines parse JSON; grep on free text stops working the moment you have more than one server.
- **Every line carries the request ID** from phase 03, plus `agency_id` and `user_id` where known. One filter then reconstructs a single user's entire failed request.
- **Use levels honestly.** `error` means a human must look; `warning` means it is worth a pattern check; `info` is business events. Logging everything at `error` means nothing is an error.
- **Never log credentials, tokens or full request bodies.** Laravel's logging config can redact — configure it, then verify by triggering a login failure and reading the line.
- Log the business events you would want a history of: bookings created and cancelled, returns, failed logins, rate limits hit.

## Error tracking

- Sentry on both sides — the free tier is ample. It groups identical errors, keeps stack traces, and shows a release-over-release trend.
- Attach `agency_id`, `user_id` and the request ID as context, and **scrub personal data** before it leaves your server.
- On the client, wrap routes in an **error boundary** so a render failure shows a recoverable screen instead of a blank page — and report it.
- Tag releases so you can see which deploy introduced a spike.

## Health checks and readiness

```
GET /api/v1/health   → 200  process is alive
GET /api/v1/ready    → 200  database and Redis reachable
                       503  dependency down
```

## The distinction that matters

**Liveness** asks whether the process should be restarted. **Readiness** asks whether it should receive traffic. Conflating them causes a restart loop when the database is briefly unavailable — the app was fine; its dependency was not. Knowing this distinction by name is a solid infrastructure signal.

## A few metrics worth having

- Request rate, error rate and p95 latency per endpoint. **p95, not average** — an average hides the slow tail that users actually feel.
- Booking successes versus 409 conflicts. A rising conflict rate is a product signal, not just a technical one.
- Cache hit rate, from phase 15.
- Queue depth and job failure rate once you have queues.
- You do not need Prometheus and Grafana for this. A `/metrics` endpoint and honest logs are enough — and knowing what you would measure is most of the answer.

## Backups, which are part of observability

Nightly `pg_dump` to object storage, with a retention policy. Then — and this is the part everyone skips — **restore one**. A backup you have never restored is a hypothesis, not a backup. Document the restore procedure and the time it took, because in an interview "we take nightly backups" and "I have restored one and it takes eleven minutes" are answers from two different people.

## Warning

> Personal data in logs is a data protection problem, not just untidiness. Customer names, CIN numbers and phone numbers must not appear in log lines or error reports. Configure scrubbing, then verify it by causing an error on purpose and reading what was actually captured.

## Tasks

- [ ] Switch logging to structured JSON
- [ ] Attach request ID, agency and user to every line
- [ ] Configure redaction, then verify it by triggering a failure
- [ ] Sentry on both sides with scrubbing
- [ ] React error boundary around the routes
- [ ] Health and readiness endpoints
- [ ] Log the key business events
- [ ] Expose basic metrics including p95
- [ ] Nightly `pg_dump` to object storage
- [ ] **Perform a restore** and document how long it took

## Done when

You can trigger an error in production, find it in Sentry with tenant context, trace it through the logs by request ID, and confirm no personal data was captured anywhere.

## What this teaches

| Area | Skill |
| --- | --- |
| DevOps | Structured logging and correlation IDs ★★★ |
| DevOps | Error tracking, Sentry ★★★ |
| DevOps | Health checks — liveness vs readiness ★★★ |
| DevOps | Metrics, p95 latency, error rate ★★★ |
| DevOps | Backups and tested restores ★★★ |
| React | Error boundaries ★★★ |
| Architecture | Designing for operability |

## Interview questions

**Q. How would you debug a production error you can't reproduce?**

Start from the request ID. Every log line carries it along with agency_id and user_id, so I can reconstruct the whole request path, then cross-reference the Sentry event with the same ID for the stack trace and release. If it correlates with a deploy, the release tag shows it immediately.

**Q. Liveness versus readiness?**

Liveness asks whether the process should be restarted; readiness asks whether it should receive traffic. If Postgres is briefly down the app is alive but not ready — conflating them restarts a perfectly healthy process in a loop while the real problem sits elsewhere.

**Q. Why p95 rather than average latency?**

The average hides the tail. If 95% of requests take 50ms and 5% take four seconds, the average looks fine while one user in twenty has a bad experience. p95 and p99 are where the users who complain actually live.

## Search terms

- structured logging best practices
- sentry laravel react setup
- liveness vs readiness probe
- react error boundary tutorial
- postgres backup restore pg_dump
