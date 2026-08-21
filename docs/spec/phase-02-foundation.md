# Phase 02 — Docker Compose — the whole environment in one command

> **Group** Foundation · **Side** Infra · **Risk** medium (2/3) · **Depends on** 01

**Goal.** `docker compose up` starts Postgres, Redis, PHP-FPM, Nginx and Vite at pinned versions, on any machine.

## Services

```
services:
  db:      postgres:16-alpine     5432   named volume, healthcheck
  redis:   redis:7-alpine         6379   cache, queue, sessions
  api:     php:8.3-fpm            9000   your Dockerfile
  nginx:   nginx:alpine           8000   fronts the api
  client:  node:22-alpine         5173   vite dev server
  mailpit: axllent/mailpit        8025   catches outbound mail
```

## Details that separate a real setup from a copied one

- **Healthchecks and `depends_on: condition: service_healthy`.** Without them the API starts before Postgres accepts connections and your first migration fails on a cold boot.
- **Named volumes for database data** — `docker compose down` must not wipe your work. Know the difference between `down` and `down -v` before you learn it the hard way.
- **Pin every image tag.** `postgres:16-alpine`, never `postgres:latest`. Reproducibility is the entire point.
- **Multi-stage Dockerfile** for the API: one stage installs Composer dependencies, the final stage carries only what runtime needs. Smaller image, smaller attack surface.
- **Run as a non-root user** inside the container. This is the first line in every container security checklist.
- **Enable the Postgres extensions you need at build time** — `btree_gist` for the exclusion constraint in phase 06, `pg_trgm` for fuzzy customer search in phase 12.

## Make it one command

```
make up        # build + start everything
make fresh     # migrate:fresh --seed
make test      # both suites
make shell     # into the api container
make psql      # straight into the database
```

## Why this phase is early

Because every later phase depends on the versions being right, and because "clone it and run `make up`" in your README is a claim most portfolios cannot make. It also means the CI pipeline in phase 20 runs the same stack your laptop does — no drift.

## Warning

> Do not put secrets in `docker-compose.yml`. Use a `.env` file that is git-ignored, with a committed `.env.example` holding empty keys. Compose reads `.env` automatically.

## Tasks

- [ ] Write `docker-compose.yml` with all services
- [ ] Healthchecks and `service_healthy` dependencies
- [ ] Multi-stage Dockerfile for the API, non-root user
- [ ] Named volume for Postgres data
- [ ] Enable `btree_gist` and `pg_trgm`
- [ ] Add a `Makefile` with the shortcuts
- [ ] Commit `.env.example`, ignore `.env`
- [ ] Verify a cold boot on a clean machine

## Done when

You delete every local install of PHP, Postgres and Node, run `make up` on a clean checkout, and the whole system comes up working.

## What this teaches

| Area | Skill |
| --- | --- |
| DevOps | Docker — images, containers, volumes, networks ★★★ |
| DevOps | Docker Compose for multi-service local development ★★★ |
| DevOps | Environment variables and secret management ★★★ |
| DevOps | Multi-stage builds, image size, non-root users |

## Interview questions

**Q. Why Docker for a project this size?**

Version parity. Postgres 16, PHP 8.3 and Node 22 are pinned, so my laptop, CI and production run the same stack. It also means a new developer is productive in one command instead of a day of setup.

**Q. Difference between an image and a container?**

An image is the immutable build artifact; a container is a running instance of it with a writable layer on top. Data that must survive goes in a volume, not the container layer.

## Search terms

- docker compose laravel postgres nginx
- docker multi stage build php
- dockerfile best practices security
