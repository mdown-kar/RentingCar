# Phase 20 — Deploy, and know how it scales

> **Group** Production · **Side** Infra · **Risk** high (3/3) · **Depends on** 17, 19

**Goal.** A live HTTPS URL with realistic data, deployed without downtime — and clear answers about what breaks next.

## The arrangement

```
                    ┌─ / ────────► React build (static)
Nginx ── TLS ───────┤
                    └─ /api ─────► PHP-FPM ──► Postgres
                                      │            │
                                  Horizon      Redis
```

## Same domain, one advantage

Serving the client and the API from one origin means no CORS in production, and it makes an `HttpOnly` cookie viable if you ever revisit the token decision. Nginx serves the built assets at the root with a `try_files` fallback to `index.html`, so React Router deep links survive a refresh — without that fallback, sharing a URL to a specific booking returns 404 and it looks broken.

## Deployment steps

- A DigitalOcean droplet — you have done this with `centreFormation`, so this should be among your faster phases.
- Managed Postgres if the budget allows: automated backups, point-in-time recovery, and one less thing to run.
- `composer install --no-dev --optimize-autoloader`, then `config:cache`, `route:cache`, `view:cache`, `event:cache`. These matter — an uncached Laravel boots noticeably slower on every request.
- `npm run build`, with the API base URL baked in at build time from the environment.
- Correct permissions on `storage` and `bootstrap/cache`; PHP-FPM running as a non-root user.
- Domain and a free Let's Encrypt certificate. An HTTP-only demo link reads as careless.
- **Verify `APP_DEBUG=false`.** Then verify it again after your first deploy — with it on, any error exposes environment variables, database credentials and full stack traces.

## Zero-downtime deployment

Release into a timestamped directory, share `storage` and `.env` by symlink, then atomically swap the `current` symlink and reload PHP-FPM. Rolling back becomes repointing a symlink — seconds, not a rebuild. Deployer or a short shell script both work; the pattern is what matters, and it pairs with the expand-and-contract migrations from phase 17. **Put the app in maintenance mode only if a migration genuinely requires it** — with expand-and-contract, most do not.

## Demo data is part of the deployment

- Seed three realistic agencies — a dozen cars each with Moroccan plates, thirty customers, rentals across past, present and future, some in progress and some returned late.
- A live app with an empty database is worse than no link at all.
- Demo credentials in the README so a recruiter gets in without registering. Make the account unable to destroy the data, or reset the database nightly on a schedule.
- Three tenants means you can demonstrate isolation live — log in as one agency and show that the other's fleet is unreachable. That is a memorable thirty seconds in an interview.

## Where it breaks next — have this answer ready

- **First:** the single web server. Fix by running several behind a load balancer — the API is stateless with token auth, so this works without sticky sessions. That statelessness was a phase 07 decision paying off.
- **Then:** database connections, because each PHP-FPM worker holds one. Fix with PgBouncer in transaction mode.
- **Then:** read load. Fix with read replicas, sending list and search queries to a replica and accepting brief replication lag — but never for availability, where stale data means a double booking.
- **Then:** table size. Fix by partitioning `rentals` by date range; historical partitions can be archived to cold storage.
- **Last:** tenant scale. Fix by sharding on `agency_id` — which is exactly why every tenant-owned table has that column, and worth pointing out.
- **The honest closer:** "none of these are needed at my current scale, and I would measure before doing any of them." Saying that is stronger than describing the architecture you did not need.

## Warning

> Rehearse the rollback before you need it. A deploy you cannot reverse is a deploy you will be frightened to make, and fear of deploying is how projects quietly stop being maintained.

## Tasks

- [ ] Provision the droplet, harden SSH
- [ ] Nginx serving the build with `try_files` fallback
- [ ] Deploy the API, run migrations
- [ ] All four Laravel cache commands
- [ ] Domain plus Let's Encrypt
- [ ] Verify `APP_DEBUG=false` in production
- [ ] Horizon and the scheduler running under a supervisor
- [ ] Seed three realistic demo agencies
- [ ] Read-only demo account in the README
- [ ] Atomic symlink releases
- [ ] **Practise a rollback** and time it
- [ ] Write the scaling ladder into the README

## Done when

You send a link, a stranger logs in with the demo account and books a car within a minute, over HTTPS, with deep links surviving a refresh — and you can deploy a change and roll it back in under two minutes.

## What this teaches

| Area | Skill |
| --- | --- |
| DevOps | VPS provisioning, SSH hardening ★★★ |
| DevOps | Nginx — static files, reverse proxy, try_files ★★★ |
| DevOps | TLS, certificates, HSTS ★★★ |
| DevOps | Zero-downtime deployment, atomic symlink releases ★★★ |
| DevOps | Laravel production caching commands ★★★ |
| Architecture | Horizontal scaling and statelessness ★★★ |
| Architecture | Read replicas, replication lag ★★★ |
| SQL | Table partitioning, connection pooling ★★★ |

## Interview questions

**Q. How does this scale to a hundred times the traffic?**

In order: multiple web servers behind a load balancer, which works because token auth keeps the API stateless. Then PgBouncer, because each PHP-FPM worker holds a connection. Then read replicas for lists and search, though not availability, where lag would mean double bookings. Then partitioning rentals by date. Sharding on agency_id is the last resort, and the schema already supports it. None of it is needed at my scale, and I'd measure before doing any of it.

**Q. How do you deploy without downtime?**

Atomic symlink releases — build into a timestamped directory, share storage and .env, swap the current symlink, reload PHP-FPM. Rollback is repointing the symlink. Combined with expand-and-contract migrations, so the old and new code can both run against the schema during the swap.

**Q. Why can't you put availability on a read replica?**

Replication lag. A replica that's 200ms behind can report a car free that was just booked, and the exclusion constraint would then reject the write after the user has already been told it worked. Reads that inform a write decision go to the primary.

## Search terms

- deploy laravel react nginx same server
- zero downtime deployment laravel deployer
- nginx try_files react router spa
- pgbouncer connection pooling
- postgres read replica laravel
