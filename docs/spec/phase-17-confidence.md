# Phase 17 — Continuous integration — the pipeline that says no

> **Group** Confidence · **Side** Infra · **Risk** medium (2/3) · **Depends on** 16

**Goal.** Every push runs the full quality gate automatically, so `main` is always deployable.

## The pipeline

```
on: [push, pull_request]

api:                          client:
  ├ composer install            ├ npm ci
  ├ pint --test                 ├ eslint
  ├ larastan (level 8)          ├ tsc --noEmit
  ├ pest --parallel             ├ vitest
  └ composer audit              └ npm audit

e2e:  docker compose up → playwright → artifacts on failure
```

## Why this is worth a phase

A green badge on the README is the visible part. The real value is that quality stops depending on you remembering. Formatting, static analysis, type checking, tests and dependency audits all run on every push, so code review is spent on design rather than style — which is exactly how a professional team works, and exactly what a hiring manager is checking for when they open your Actions tab.

## Details that make it usable

- **Cache Composer and npm** between runs. An uncached pipeline takes minutes and you stop waiting for it.
- **Run the two sides as parallel jobs**, not sequentially.
- **Services for Postgres and Redis** in the workflow, at the same pinned versions as `docker-compose.yml`. Parity between CI and local is the point of phase 02.
- **Fail on high-severity audit findings**, not on every advisory, or you will start ignoring it.
- **Upload Playwright traces and screenshots** on failure. Debugging a red E2E run without artifacts is guesswork.
- **Branch protection on `main`:** no merge unless CI is green. Configure it — the discipline is worth more than the badge.

## Raise the bar as you go

Start Larastan at level 6 and raise it a level each time the code is clean. By the end of the project, level 8 passing on a codebase you wrote yourself is a genuinely strong signal — and the incremental path is what makes it achievable rather than demoralising.

## Migrations in the pipeline

- Run `migrate` against a fresh database on every CI run — a migration that only works on your laptop's existing schema is a deploy failure waiting to happen.
- Also run `migrate:rollback` in CI. This is the only thing that ever tests your `down()` methods, and untested rollbacks are how a bad deploy becomes an outage.
- Keep migrations backward-compatible with the currently deployed code. Adding a column is safe; dropping or renaming one requires two deploys — expand, migrate, then contract. Knowing that pattern by name is worth mentioning.

## Warning

> Never put secrets in the workflow file. Use GitHub Actions encrypted secrets, and remember that secrets are not available to workflows triggered by pull requests from forks — a security feature that surprises people.

## Tasks

- [ ] Write the CI workflow with parallel jobs
- [ ] Postgres and Redis services at pinned versions
- [ ] Cache Composer and npm
- [ ] Run migrate and migrate:rollback on a fresh database
- [ ] Add `composer audit` and `npm audit`
- [ ] Upload Playwright artifacts on failure
- [ ] Enable branch protection on `main`
- [ ] Raise Larastan a level and fix what it finds
- [ ] Add the CI badge to the README

## Done when

Opening a pull request runs the whole gate automatically, a deliberately broken type or a failing test blocks the merge, and the README badge is green.

## What this teaches

| Area | Skill |
| --- | --- |
| Git | CI/CD basics, GitHub Actions ★★★ |
| Git | Branch protection, pull request workflow ★★★ |
| DevOps | Pipeline design, caching, parallel jobs ★★★ |
| DevOps | Migration safety — expand and contract ★★★ |
| DevOps | Secret management in CI ★★★ |
| Testing | Static analysis and type checking as gates ★★★ |

## Interview questions

**Q. What runs in your CI?**

Formatting, static analysis at Larastan level 8, the Pest suite, ESLint, tsc --noEmit, Vitest, and dependency audits — plus Playwright against the Docker stack. Main is branch-protected, so nothing merges red. It means review time goes on design instead of style.

**Q. How do you deploy a schema change safely?**

Expand and contract. Add the new column, deploy code that writes both, backfill, then deploy code that reads the new one, and only then drop the old. A single deploy that renames a column breaks every request in the window between migration and rollout.

## Search terms

- github actions laravel postgres
- github actions cache composer npm
- expand contract migration pattern
- branch protection rules github
