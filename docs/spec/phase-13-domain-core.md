# Phase 13 — The booking lifecycle

> **Group** The domain core · **Side** Both · **Risk** high (3/3) · **Depends on** 12

**Goal.** The full counter workflow — reserve, start, return, cancel — modelled as explicit state transitions rather than an editable status column.

## Model it as a state machine

```
  reserved ──start──► ongoing ──return──► returned
     │                    │
     └──cancel──► cancelled
                          └──cancel──► (refused)
```

## Why that matters

If status is just a column anyone can set, every invalid combination is reachable: a returned rental returned twice, a cancelled rental started, a rental ongoing with no pickup recorded. Define the permitted transitions in one place and refuse everything else with **409 Conflict** and a message naming the current state. This is a small amount of code that eliminates an entire category of bug, and describing your domain as a state machine is language that signals experience.

## The endpoints

```
POST   /api/v1/rentals              create, status reserved   → 201
PATCH  /api/v1/rentals/{id}         change dates, car, price  → 200
POST   /api/v1/rentals/{id}/start   → ongoing                 → 200
POST   /api/v1/rentals/{id}/return  → returned                → 200
POST   /api/v1/rentals/{id}/cancel  → cancelled               → 200
```

## Actions are not updates

Notice that starting, returning and cancelling are separate `POST` endpoints rather than a `PATCH` setting `status`. Each one is a distinct business operation with its own rules, its own authorisation and its own side effects — a return records a timestamp and may calculate an overrun charge. Exposing them as verbs makes the API self-documenting and keeps the transition logic out of a generic update method. Purists will argue this is not perfectly RESTful; the counter-argument is that these are domain actions, not resource mutations, and every serious API does this.

## The create flow, in the order a counter actually works

- **Dates first.** Availability is meaningless without them, so the form starts there.
- The car list then shows only free cars for that range, from phase 12's endpoint.
- **Pick or create the customer inline.** Forcing an agent to leave the form while someone stands at the counter is bad design, and building it is a good exercise in nested form state.
- Price auto-calculated from daily rate × days, then shown as an **editable** field. Real agencies negotiate.
- Save as `reserved`, or `ongoing` if the rental starts today.

## Price is stored, not derived

You decided this in phase 01 and it pays here. The rental keeps its agreed price forever, so next season's rate change does not rewrite history. Audit the display path and make sure nothing reads `car.daily_price` for an existing rental — that mistake is invisible until prices change, and then every past invoice is wrong.

## The return flow

- A 'currently out' list: status `ongoing`, `returned_at` null.
- Returning sets `returned_at` and moves to `returned`.
- If `returned_at` is past the period end, compute the overrun in days and money and **show** it. Whether to charge it is the agent's decision, not the application's — surfacing information rather than enforcing policy is usually the right call in business software.
- Once returned, the rental stops blocking dates. That is the partial exclusion constraint doing its job with no extra code.

## The edit flow, where the bugs live

- Changing dates re-runs availability *excluding itself*.
- Changing the car checks the new car for that range.
- Cancelling frees the dates immediately — again, for free, via the constraint's `WHERE` clause.
- A rental that has already started should not have its start date moved into the future. Write the rule down; it is the kind of edge case interviewers invent on the spot.

## Client side

- A multi-step form held in one screen. Consider `useReducer` over six `useState` calls — the state transitions are related, and this is exactly the case the hook exists for.
- Refetch availability when dates change, debounced, using the hook from phase 11.
- Each action button is a typed React Query mutation that invalidates both the rental and the availability queries on success.
- Handle **409** distinctly from 422: 409 means the state changed underneath you, so refetch and show what is true now rather than repeating the form error.

## Warning

> Do not let transition rules leak into the React app. The client may hide a button, but the API must refuse the action — the API is public and anyone can call it directly. Any rule enforced only in the frontend is not enforced.

## Tasks

- [ ] Define permitted transitions in one place
- [ ] Separate endpoints for start, return and cancel
- [ ] 409 with the current state on an invalid transition
- [ ] Booking endpoint with availability check
- [ ] Edit endpoint excluding itself from availability
- [ ] Overrun calculation shown, not enforced
- [ ] Store price at booking time and audit the display path
- [ ] Date-first booking form with inline customer creation
- [ ] `useReducer` for the multi-step form state
- [ ] Typed mutations invalidating rentals and availability
- [ ] Handle 409 by refetching, not by showing a field error

## Done when

You can book a car for next week, edit the dates, cancel and rebook it, start it, and return it three days late seeing the overrun calculated — and every invalid transition is refused by the API even when you call it directly with curl.

## What this teaches

| Area | Skill |
| --- | --- |
| Architecture | State machines and modelling domain workflows ★★★ |
| Architecture | Domain actions vs CRUD in API design ★★★ |
| Laravel | Custom validation rules ★★★ |
| Laravel | Enums and casting ★★★ |
| Web | 409 Conflict and when to use it ★★★ |
| React | useReducer — and when to prefer it to useState ★★★ |
| React | useEffect — dependencies, cleanup, common mistakes ★★★ |
| React | Lists and keys — why index-as-key is a bug ★★★ |
| TypeScript | Discriminated unions for state ★★★ |

## Interview questions

**Q. How do you model the rental status?**

As a state machine with explicit permitted transitions, not a settable column. Start, return and cancel are separate endpoints, each with its own rules and side effects, and an invalid transition returns 409 naming the current state. It removes a whole class of impossible-state bugs.

**Q. Why is price stored on the rental rather than calculated?**

Because rates change. A rental agreed in March at 300 MAD a day must still read 300 in December. Deriving it from the car would silently rewrite history, and every past invoice would become wrong the moment someone edited a price.

**Q. Isn't a POST to /rentals/{id}/cancel unRESTful?**

Slightly, and deliberately. Cancelling isn't a field mutation — it has authorisation rules and side effects that a generic PATCH would hide. Modelling domain actions as verbs makes the API self-documenting and keeps transition logic out of a catch-all update method.

## Search terms

- state machine pattern backend
- laravel enum status transitions
- react usereducer typescript
- rest api actions vs crud
