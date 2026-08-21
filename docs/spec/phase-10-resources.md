# Phase 10 — Fleet management, end to end and fully typed

> **Group** Resources · **Side** Both · **Risk** medium (2/3) · **Depends on** 09

**Goal.** Complete car management across both applications — the vertical slice you will repeat for every resource afterwards.

## The contract

```
GET    /api/v1/cars           paginated, filterable, sortable  → 200
POST   /api/v1/cars           create                           → 201
GET    /api/v1/cars/{id}      one (404 if not yours)           → 200
PATCH  /api/v1/cars/{id}      partial update                   → 200
DELETE /api/v1/cars/{id}      archive, not destroy             → 204
```

## API side

- An API resource controller — no `create` or `edit` routes; those are the client's concern now.
- `StoreCarRequest` and `UpdateCarRequest`. Validation is its own layer and does not belong in the controller.
- **The subtle rule:** the plate is unique *per agency*, expressed with `Rule::unique()->where('agency_id', ...)` — and on update it must ignore the current record, or editing a car fails validation against itself.
- **PATCH, not PUT**, for partial updates. PUT means replace the whole resource; sending three fields and wiping the rest is what happens when the semantics are ignored.
- Validation failures return **422** with a field-keyed error object matching the envelope from phase 03.
- **Soft delete, not hard delete.** A car with rental history cannot be removed without corrupting that history. Archive it and exclude archived cars from availability. This is a domain decision — write it down.

## Filtering and pagination, designed once

- Filters as an allow-list of query parameters — `?status=available&fuel_type=diesel`. Never build a query from arbitrary client input.
- Sorting from a fixed list of permitted columns. `?sort=-daily_price` parsed into column and direction; anything not on the list is rejected, not passed to the database.
- Paginate from the first line of code. A list endpoint that returns everything is a production incident waiting for a real customer.
- Return pagination metadata in a consistent shape and type it in the client — one generic `Paginated<T>` serves every resource.

## The generic that saves you the rest of the project

```
export const paginated = (item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      current_page: z.number(),
      last_page:    z.number(),
      total:        z.number(),
    }),
  });

export type Paginated = { data: T[]; meta: PageMeta };

const CarPage = paginated(CarSchema);   // typed and validated, one line
```

## Client side

- `useCars(filters)` built on React Query, with the typed key factory from phase 04 so invalidation is reliable.
- Mutations that **invalidate** the list on success rather than manually patching cache — correct first; optimise later if it feels slow.
- **React Hook Form with the Zod resolver**, so the same schema validates the form and the response. Write the rule once.
- **Map 422 onto individual fields.** One generic error banner above a form with eight inputs is the clearest signal of an inexperienced frontend.
- All four states — loading, empty, error, success — every time. The empty state should tell the user what to do next, not just say 'no data'.
- Confirm before archiving, and show the consequence: how many rentals reference this car.

## Optimistic updates, where they belong

For a toggle like marking a car unavailable, update the cache immediately and roll back on failure — the interface feels instant. For anything with a real chance of server-side rejection, such as a booking, do **not** be optimistic; showing success and then retracting it is worse than a short wait. Knowing which is which is the actual skill.

## Warning

> You are about to build the same shape three more times. Do not extract an abstraction yet — two examples is not enough evidence to know what varies. Knowing when *not* to DRY is worth as much as knowing when to.

## Tasks

- [ ] Resource controller with all five endpoints
- [ ] Form requests with per-agency unique plate ignoring self
- [ ] PATCH semantics for partial update
- [ ] Allow-listed filters and sorting
- [ ] Pagination from the first commit
- [ ] Soft delete with availability exclusion
- [ ] Generic `paginated()` Zod helper
- [ ] `useCars()` query and typed mutations
- [ ] React Hook Form plus Zod resolver
- [ ] 422 mapped to individual fields
- [ ] All four UI states, with a useful empty state
- [ ] Branch, pull request, self-review, merge

## Done when

You can manage the fleet entirely from the UI, field errors land on the right fields, the same plate exists happily in two agencies, and archiving a car with history is refused with a clear explanation.

## What this teaches

| Area | Skill |
| --- | --- |
| Web | HTTP methods and their semantics — PATCH vs PUT ★★★ |
| Web | Status codes — 200/201/204/404/409/422 ★★★ |
| Web | REST — filtering, sorting, pagination ★★★ |
| Laravel | API resource controllers ★★★ |
| Laravel | Form requests, conditional unique rules ★★★ |
| Laravel | API resources and response shaping ★★★ |
| Laravel | Soft deletes |
| React | Forms — React Hook Form, Zod resolver ★★★ |
| React | Controlled inputs, field-level errors ★★★ |
| React | React Query mutations, invalidation, optimistic updates ★★★ |
| TypeScript | Generics in practice ★★★ |
| TypeScript | Utility types — Partial, Pick, Omit ★★★ |

## Interview questions

**Q. PATCH or PUT for an edit form?**

PATCH, because the client sends only changed fields. PUT means replace the entire resource, so any field omitted should be cleared — using PUT for a partial update is how fields silently get wiped.

**Q. How do you handle validation errors from the API?**

The API returns 422 with a field-keyed error object. The axios interceptor narrows it to a typed error and React Hook Form sets each message on its own field. The user sees the problem where the problem is.

**Q. When would you not use an optimistic update?**

When rejection is plausible. A booking can fail on an exclusion constraint, so showing success and then retracting it is worse than a spinner. Optimism is for actions that essentially always succeed.

## Search terms

- react hook form zod typescript
- tanstack query mutations invalidation
- laravel api filtering sorting
- patch vs put rest api
- optimistic updates react query
