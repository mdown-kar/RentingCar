# Phase 16 — Testing what would hurt if it broke

> **Group** Confidence · **Side** Both · **Risk** medium (2/3) · **Depends on** 14, 15

**Goal.** A suite that gives you the confidence to change code — not a coverage percentage.

## The purpose, stated plainly

Tests are not there to prove the code works today. They are there so that in three months you can change something and know within thirty seconds whether you broke anything. Every test you write should be defensible in those terms. If a test would not catch a mistake you could realistically make, delete it — it is maintenance cost with no return.

## The pyramid, applied here

```
  E2E (Playwright)       a handful — the money paths only
  Feature (Pest)         the bulk — endpoints, auth, tenancy
  Unit (Pest / Vitest)   many — pure logic, overlap maths
```

## Backend, in priority order

- **Tenant isolation.** The dataset from phase 08, run against every resource. In a SaaS these are the tests whose failure is a breach rather than a bug.
- **Overlap and availability.** All six cases plus the `[)` boundary, plus exclude-self on edit. Pure unit tests, milliseconds each.
- **The concurrency test** from phase 14 — two simultaneous bookings, exactly one wins.
- **State transitions.** Every permitted move succeeds; every forbidden one returns 409 with the current state.
- **Money.** Price at booking time survives a rate change; the overrun calculation is right including the same-day edge.
- **Auth.** Protected endpoints return 401 without a token, 403 for a real permission failure, 404 across tenants.
- **Rate limits.** The login limiter actually returns 429 — a limiter misconfigured to never fire is easy to ship and impossible to notice.

## Frontend

- Vitest plus React Testing Library. **Test behaviour, not implementation** — query by what the user sees (role, label, text), never by class name or component internals. A test that breaks when you rename a div is worse than no test.
- **MSW (Mock Service Worker)** to intercept requests at the network layer rather than mocking axios. Your interceptors, Zod parsing and error mapping all run for real, which is where the bugs actually are.
- The booking form: dates change → availability refetches → selecting a car and submitting calls the right endpoint.
- A 422 response puts messages on the correct fields.
- A 409 triggers a refetch rather than a field error.
- **Type-level tests count too.** If the API contract changes and `tsc --noEmit` fails in CI, TypeScript caught a bug before any test ran.

## E2E — few, and only the paths that matter

- Playwright, three or four specs at most: register and log in; book a car end to end; attempt a double booking and see the 409; return a car late and see the overrun.
- Run them against the Docker stack so it is the real system, not a mocked one.
- E2E tests are slow and flaky by nature. Keep them few and keep them meaningful — a flaky suite people learn to ignore is worse than no suite.

## What not to test

Do not test that Laravel validates, that Eloquent saves, or that React renders a prop. Testing the framework is pure maintenance cost — the framework already has its own suite. Test *your* rules: the ones you invented, that nobody else has verified. That distinction is a good thing to say out loud.

## Making the suite pleasant to run

- `RefreshDatabase` with transactions, and factories doing the heavy lifting — a readable test starts with three lines of setup, not thirty.
- Pest datasets for anything repeated across resources.
- Parallel execution — `pest --parallel` — because a slow suite is a suite you stop running.
- A suite that takes over two minutes locally will be skipped. Treat its speed as a feature.

## The coverage answer

If asked your coverage percentage, the number is the weak answer. The strong one: "I covered tenant isolation, availability, the booking race and money calculations, because those are the places where a bug is invisible until it is expensive. I deliberately did not chase 100% — testing framework behaviour adds maintenance without adding confidence." That reply tells an interviewer you have thought about testing rather than measured it.

## Warning

> Write the tenant isolation tests before you need them, not after. They are the only tests in this project whose absence is a security problem rather than a quality one.

## Tasks

- [ ] Tenant isolation dataset across every resource
- [ ] Unit tests for all six overlap cases and the boundary
- [ ] Concurrency test in the suite
- [ ] Every state transition, permitted and forbidden
- [ ] Price-at-booking and overrun tests
- [ ] 401, 403 and 404 auth tests
- [ ] A test proving the login limiter returns 429
- [ ] Set up MSW and test the booking form
- [ ] 422 to fields and 409 to refetch, both tested
- [ ] Three or four Playwright specs against Docker
- [ ] `tsc --noEmit` as a CI step
- [ ] Get the suite under two minutes with `--parallel`

## Done when

Both suites are green in under two minutes, every test maps to a rule you invented rather than one the framework provides, and deliberately breaking tenant scoping turns the suite red immediately.

## What this teaches

| Area | Skill |
| --- | --- |
| Testing | Unit, integration and E2E — the pyramid ★★★ |
| Testing | Arrange–Act–Assert ★★★ |
| Testing | Testing behaviour, not implementation ★★★ |
| Testing | Mocking, stubbing, MSW ★★★ |
| Testing | Coverage — and why 100% is a bad goal ★★★ |
| Testing | Flaky tests and why they destroy trust |
| Laravel | Pest, feature vs unit tests, RefreshDatabase ★★★ |
| Laravel | Factories and datasets in tests ★★★ |
| React | React Testing Library, queries by role ★★★ |
| TypeScript | tsc --noEmit as a test |

## Interview questions

**Q. What do you test, and what do you leave alone?**

My own rules — tenant isolation, range overlap, the booking race, money. Not the framework: if Laravel's validator or Eloquent's save breaks, that's their test suite's job. Testing framework behaviour is maintenance cost with no added confidence.

**Q. What's your coverage?**

I haven't optimised for the number. The parts where a bug is silent and expensive are covered thoroughly — isolation, availability, concurrency, pricing. Chasing 100% would mostly mean asserting that the framework works.

**Q. Why MSW rather than mocking axios?**

Because mocking axios skips my own interceptors, the Zod parsing and the error mapping — which is exactly where the bugs live. MSW intercepts at the network layer, so the whole client path runs for real against a controlled response.

## Search terms

- pest php testing tutorial
- react testing library best practices
- msw mock service worker react
- playwright getting started
- testing pyramid explained
