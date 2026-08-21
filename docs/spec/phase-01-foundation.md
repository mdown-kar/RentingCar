# Phase 01 — Repository, documentation and architecture decision records

> **Group** Foundation · **Side** Both · **Risk** low (1/3) · **Depends on** 00

**Goal.** A public repository whose first commit contains no code — only the reasoning that the code will follow.

## Layout

```
car-rental-saas/
├── api/                     Laravel 12
├── client/                  React 19 + TypeScript
├── docs/
│   ├── requirements.md      v1 scope, in and out
│   ├── api.md               endpoint contract, written first
│   ├── schema.dbml          the ERD source
│   ├── erd.png              the exported diagram
│   ├── threat-model.md      what an attacker would try
│   └── adr/
│       ├── 0001-postgres-over-mysql.md
│       ├── 0002-api-only-backend.md
│       ├── 0003-typescript-from-day-one.md
│       ├── 0004-shared-schema-multitenancy.md
│       └── 0005-token-storage.md
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## Architecture Decision Records

An ADR is a short numbered file with four headings: **Context**, **Decision**, **Consequences**, **Status**. Real engineering teams use them; almost no junior portfolio has them. A reviewer who opens `docs/adr/` and finds five honest records has already formed an opinion about you before reading a single line of code.

## Write the API contract before the code

`api.md` lists every endpoint, its request shape, its response shape and its error codes. It exists before the implementation because two applications have to agree on it — and because in TypeScript this document becomes your `src/types` directory almost literally. Design the contract, then satisfy it.

## The v1 boundary

- **In:** auth and agency settings · fleet CRUD · customer CRUD · availability by date range · the booking lifecycle (reserve, start, return, cancel).
- **Out:** online payment · customer self-service login · multi-branch · reporting dashboards · maintenance and damage records · PDF contracts · notifications.
- **Roles in v1:** agency admin only, scoped to their own agency.
- Write the *out* list in the README with a reason for each. Scope discipline reads as seniority; an unfinished feature list reads as the opposite.

## First commit

```
git init && git branch -M main
git add .
git commit -m "docs: v1 scope, API contract and architecture decision records"
git remote add origin https://github.com/mdown-kar/car-rental-saas.git
git push -u origin main
```

## Warning

> Write `.gitignore` **before** the first commit, covering both sides: `/api/vendor`, `/api/.env`, `/api/storage/*.key`, `/client/node_modules`, `/client/.env*`, `/client/dist`. Git only ignores untracked files — committing a secret and then ignoring it leaves it in history forever.

## Tasks

- [ ] Create the full folder structure
- [ ] Write `.gitignore` for both sides before committing anything
- [ ] Write `requirements.md` with the in/out boundary
- [ ] Write the five ADRs
- [ ] Draft `api.md` — every endpoint, request, response, error code
- [ ] Export `erd.png` and commit `schema.dbml`
- [ ] First commit, push, set repo description and topics

## Done when

A stranger reads `docs/` and can describe what you are building, how the API is shaped, what you deliberately excluded, and why — with zero code in the repository.

## What this teaches

| Area | Skill |
| --- | --- |
| Git | add / commit / push / pull / branch ★★★ |
| Git | Conventional commits, good messages |
| Git | .gitignore — never committing secrets ★★★ |
| Architecture | Documenting decisions, ADRs |
| Web | REST — resources, statelessness, versioning ★★★ |

## Interview questions

**Q. How do you document architectural decisions?**

ADRs in the repo — context, decision, consequences, status. It means the reasoning survives even when the person who made the decision leaves, and it stops the same argument being had twice.

## Search terms

- architecture decision records adr
- how to design a rest api contract
- conventional commits explained
