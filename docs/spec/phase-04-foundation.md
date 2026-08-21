# Phase 04 — React 19 + TypeScript, typed end to end

> **Group** Foundation · **Side** Client · **Risk** medium (2/3) · **Depends on** 03

**Goal.** A strictly-typed React app whose API layer validates responses at runtime, with the compiler configured to be hostile.

## Install

```
npm create vite@latest client -- --template react-ts
npm i react-router-dom axios zod
npm i @tanstack/react-query @tanstack/react-query-devtools
npm i react-hook-form @hookform/resolvers
npm i -D tailwindcss @tailwindcss/vite
npm i -D eslint typescript-eslint vitest @testing-library/react
```

## Configure TypeScript to be strict

- `strict: true` is the baseline, not the goal. Also enable `noUncheckedIndexedAccess` — it forces you to handle the case where `array[0]` is undefined, which is where a third of runtime crashes come from.
- `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`. Loud now, quiet later.
- **Ban `any` in ESLint.** When you're stuck, use `unknown` and narrow it. `any` switches the compiler off exactly where you needed it most.
- Path aliases (`@/components`) so imports stay readable as the tree grows.

## The pattern that ties the whole client together

Define a Zod schema per resource. Derive the TypeScript type from it with `z.infer`. Parse every API response through the schema inside the API layer. You now have one source of truth: the type and the runtime check cannot drift, and if the backend changes a field you find out immediately with a clear error instead of a blank screen three components deep.

## How that looks

```
export const CarSchema = z.object({
  id:           z.number(),
  plate_number: z.string(),
  model:        z.string(),
  daily_price:  z.coerce.number(),
  fuel_type:    z.enum(['petrol','diesel','hybrid','electric']),
});

export type Car = z.infer;   // ← type, for free

export async function getCars(): Promise {
  const { data } = await api.get('/cars');
  return z.array(CarSchema).parse(data.data);  // ← runtime guarantee
}
```

## The axios layer, written once

- One configured instance. Base URL from `import.meta.env`, never hardcoded.
- Request interceptor attaching the bearer token.
- Response interceptor mapping **401** to a logout, **403** to a permission message, **422** to typed field errors, **429** to a rate-limit notice, **5xx** to a generic failure. Every component gets consistent behaviour for free.
- A typed `ApiError` class so `catch` blocks aren't handling `unknown` forever.

## React Query, configured deliberately

- Set `staleTime` per query type. Availability data goes stale in seconds; the agency's own profile does not. The default of zero refetches far more than you need.
- Query keys as typed factories — `carKeys.list(filters)` — never hand-written strings scattered across files. Invalidation depends on getting these right.
- Devtools in development. Seeing the cache is how you learn what the library is actually doing.
- This is why you're not writing `useState` plus `useEffect` plus three flags in every component: caching, deduplication, background refetch and stale-while-revalidate are already solved.

## CORS, understood before you hit it

The client on port 5173 calling an API on port 8000 is cross-origin, and the browser blocks it by design. Fix it in `config/cors.php` by allowing your specific origin — never `*` in production, and never with a browser extension. In phase 21 both are served from one domain and the problem disappears entirely.

## Warning

> Do not let TypeScript become decoration. If you find yourself writing `as any`, `as unknown as Car`, or `@ts-ignore`, you have turned the tool off. Stop and model the type properly — that struggle is the part that is actually teaching you.

## Tasks

- [ ] Create the Vite React-TS app
- [ ] Enable strict mode plus `noUncheckedIndexedAccess`
- [ ] Ban `any` in the ESLint config
- [ ] Set up Tailwind and path aliases
- [ ] Build the typed axios client with all interceptors
- [ ] Write the first Zod schema and infer its type
- [ ] Configure React Query with staleTime and key factories
- [ ] Fix CORS on the Laravel side
- [ ] Render `/api/v1/ping` through the full typed path

## Done when

A typed page renders data fetched through React Query and validated by Zod; deliberately breaking a field name in the API produces an immediate, readable Zod error rather than a blank screen.

## What this teaches

| Area | Skill |
| --- | --- |
| TypeScript | Basic types, interfaces vs types ★★★ |
| TypeScript | Generics ★★★ |
| TypeScript | Utility types — Partial, Pick, Omit, Record ★★★ |
| TypeScript | Union types, narrowing, type guards ★★★ |
| TypeScript | unknown vs any — and why any is a defeat |
| TypeScript | tsconfig strictness flags |
| React | Typed props, typed hooks, typed events ★★★ |
| React | Data fetching — loading, error, empty states ★★★ |
| Web | CORS — what it is and how to fix it properly ★★★ |
| JavaScript | ES modules, bundlers, tree shaking |

## Interview questions

**Q. If you have TypeScript, why do you need Zod?**

Types are erased at compile time. They describe what I expect from the API, not what actually arrives. Zod validates at runtime at the boundary, and I infer the TypeScript type from the same schema so the two can never disagree.

**Q. Why React Query instead of useEffect?**

Server state has different requirements from UI state — caching, deduplication, background refresh, invalidation after mutations, and cancelling stale responses. Rewriting that per component is repetitive and I'd get the race conditions wrong.

**Q. When would you reach for any?**

I wouldn't. If the shape is genuinely unknown, unknown is the honest type and I narrow it with a guard. any silently disables checking exactly where I understood the code least.

## Search terms

- react typescript 2026 setup
- zod tutorial typescript
- tanstack query v5 tutorial
- typescript generics explained
- axios interceptors typescript
