# Phase 19 — Queues and background work

> **Group** Production · **Side** API · **Risk** medium (2/3) · **Depends on** 14, 18

**Goal.** Move slow and unreliable work off the request path, and handle failure like someone who has been paged before.

## What belongs on a queue

- **Email** — booking confirmations, return receipts, password resets. An SMTP timeout must never turn into a failed booking.
- **Anything calling an external service.** You do not control their uptime; do not let it become your latency.
- **Report generation** and any export, once you have them.
- **Nightly maintenance** — marking overdue rentals, pruning expired tokens, backups.
- The test is simple: if the user does not need the result to continue, it does not belong in the request.

## Redis is already running

You started it in phase 02 for caching. The same instance drives queues. Laravel Horizon gives you a dashboard showing throughput, wait times and failures — protect it behind auth, since it exposes job payloads. Being able to open a working Horizon dashboard in a portfolio demo is a strong visual.

## The bug this phase depends on avoiding

Dispatching a job inside a transaction, from phase 14. The worker can pick it up before the commit lands and query a row that does not exist yet, producing failures that appear only under load. `dispatch()->afterCommit()`, or the global `after_commit` config, is the fix. This is one of the most common real Laravel production bugs and a very good thing to be able to describe.

## Failure handling, properly

- **Retries with exponential backoff** — `$backoff = [10, 60, 300]`. Immediate retries against a struggling service make the outage worse.
- **Jobs must be idempotent.** A queue guarantees at-least-once delivery, not exactly-once. If a job can run twice, it will — so a confirmation email job should record that it sent, and a payment job must key on an idempotency token.
- **A failed_jobs table and an alert.** Failures nobody sees are the same as data loss.
- **Set a timeout** on every job. A worker stuck forever on one job silently reduces your capacity.
- **Unique jobs** where duplicates would be harmful — Laravel's `ShouldBeUnique` uses a cache lock.

## Scheduled tasks

```
daily 02:00   pg_dump → object storage
daily 03:00   mark rentals past end_date as overdue
hourly        prune expired Sanctum tokens
weekly        recompute agency dashboard aggregates
```

## Tenancy in background work

This is where the global scope from phase 08 bites. A queued job has no authenticated user, so a scope depending on `auth()->user()` either returns nothing or throws. Pass the `agency_id` explicitly into the job and set the tenant context at the start of `handle()`. Decide the behaviour, write it in the ADR, and test a job that touches tenant data — this is precisely the gap that produces cross-tenant bugs in real SaaS products.

## Warning

> Never put a model instance in a job payload and assume it is current — Laravel serialises the ID and refetches, so the row may have changed or been deleted by the time the job runs. Handle the missing case rather than letting the job fail on null.

## Tasks

- [ ] Configure Redis queues and install Horizon behind auth
- [ ] Move email and external calls to jobs
- [ ] Audit every dispatch for `afterCommit`
- [ ] Backoff, timeout and retry limits on every job
- [ ] Make jobs idempotent, and test running one twice
- [ ] Alert on failed jobs
- [ ] Schedule backups, overdue marking and token pruning
- [ ] Pass tenant context explicitly into jobs
- [ ] Write a test for a tenant-scoped job

## Done when

A booking sends its confirmation without adding latency to the response, a deliberately failing job retries with backoff and lands in `failed_jobs` with an alert, and a tenant-scoped job touches only the right agency's data.

## What this teaches

| Area | Skill |
| --- | --- |
| Laravel | Queues, workers, Horizon ★★★ |
| Laravel | Job retries, backoff, timeouts, failed jobs ★★★ |
| Laravel | Task scheduling ★★★ |
| Laravel | afterCommit and transaction-safe dispatch ★★★ |
| Architecture | Idempotency and at-least-once delivery ★★★ |
| Architecture | Asynchronous processing, decoupling ★★★ |
| DevOps | Redis as cache and queue backend |

## Interview questions

**Q. What did you move to a queue and why?**

Email, external calls and nightly maintenance — anything the user doesn't need in order to continue. A confirmation email is not worth failing a booking over, and an SMTP timeout shouldn't become my latency.

**Q. What does idempotent mean for a job?**

That running it twice has the same effect as running it once. Queues guarantee at-least-once delivery, so duplicates happen — a worker can crash after doing the work but before acknowledging. Jobs record what they've done, or key on an idempotency token.

**Q. How do you handle tenancy in a background job?**

The global scope depends on an authenticated user, which a worker doesn't have. I pass agency_id into the job explicitly and set the tenant context at the start of handle. That gap is where cross-tenant bugs get into real SaaS products, so it's tested.

## Search terms

- laravel queues horizon tutorial
- idempotency in distributed systems
- exponential backoff retry
- laravel task scheduling cron
