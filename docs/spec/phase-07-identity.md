# Phase 07 — Authentication with Sanctum, typed on both sides

> **Group** Identity & isolation · **Side** Both · **Risk** medium (2/3) · **Depends on** 04, 05

**Goal.** An agency can register, log in, stay logged in across a refresh, and log out — with every credential path hardened and every response typed.

## The endpoints

```
POST   /api/v1/register     agency + first user, one transaction  → 201
POST   /api/v1/login        credentials → token + user           → 200
POST   /api/v1/logout       revokes the current token            → 204
GET    /api/v1/me           the logged-in user, for boot         → 200
POST   /api/v1/password/forgot   → 202  (always 202, see below)
POST   /api/v1/password/reset    → 200
```

## Registration is a transaction

Creating an agency and its first user are two inserts that must both succeed or both fail. Wrap them in `DB::transaction()`. Without it, a failure on the second insert leaves an orphan agency with no way in — and because the slug is unique, the same person cannot re-register. This is the smallest possible demonstration of why transactions exist, and it belongs in your first auth flow.

## Password handling, done properly

- **Hashing, not encryption.** Encryption is reversible by design; that is precisely what you do not want. Laravel uses bcrypt by default — consider Argon2id, which is the current recommendation and a good thing to have an opinion about.
- **Never let a password reach a log, a `dd()`, or a JSON response.** Add `password` and `remember_token` to `$hidden`, and check that your logging config isn't dumping full request bodies.
- **Check against known breaches.** Laravel's `Password::defaults()->uncompromised()` queries the Have I Been Pwned range API without ever sending the password. Length matters far more than symbol requirements — enforce a minimum of 12 characters rather than demanding punctuation.
- **Rehash on login** when the algorithm cost changes. Laravel does this for you; know that it happens.

## Two leaks hiding in ordinary auth code

- **User enumeration on login.** Returning "no account with that email" tells an attacker which addresses are registered. Return one identical message for a wrong email and a wrong password.
- **User enumeration on password reset.** Same problem. Always respond **202 Accepted** with "if that address exists, we've sent a link" — whether or not it does.
- **Timing differences** can leak the same information. Laravel's `attempt()` hashes even when the user is missing, which levels the timing. Do not hand-roll a shortcut that skips the hash when no user is found.

## Token abilities — authorization built into the credential

Sanctum tokens carry *abilities*. Issue a session token with broad abilities, but when you add the mobile app or an integration later, issue narrow ones — `rentals:read` only. Set up the pattern now even with a single ability, because retrofitting scopes onto tokens already in the wild is a migration nobody enjoys. Check them with `$user->tokenCan('rentals:read')`.

## The React side

- An `AuthContext` holding `user`, `login`, `logout` and `isLoading`, fully typed — no `any` on the context value.
- The token is attached by the axios request interceptor you built in phase 04, not by individual calls.
- A `<ProtectedRoute>` wrapper that redirects to login when there is no user.
- **Call `/me` before rendering routes on boot.** Skip this and every refresh flashes the login page for a moment, which looks broken.
- On **401** the interceptor clears auth state and redirects — one place, not thirty.
- Log in and log out must clear the React Query cache. Otherwise the next user who logs in on that machine sees the previous tenant's cached data sitting in memory.

## Where to store the token — the trade-off you must be able to argue

`localStorage` is simple and transfers to React Native, but any JavaScript on the page can read it, so one XSS bug becomes a stolen token. An `HttpOnly` cookie cannot be read by JavaScript, but requires CSRF protection and does not help a mobile client. Neither is wrong. Pick one, write both sides in an ADR, and say it out loud in the interview — the reasoning is what is being assessed, not the answer.

## Tasks

- [ ] Register endpoint wrapping agency + user in a transaction
- [ ] Login, logout and `/me`, all typed
- [ ] Identical response for wrong email and wrong password
- [ ] Password reset always returning 202
- [ ] Enforce 12+ characters and `uncompromised()`
- [ ] Add `password` to `$hidden` and check log config
- [ ] Issue tokens with explicit abilities
- [ ] Typed `AuthContext` plus `ProtectedRoute`
- [ ] Restore session via `/me` before first render
- [ ] Clear the React Query cache on login and logout
- [ ] Write the token-storage ADR with both sides

## Done when

You can register, refresh and stay logged in, be redirected on an expired token, and log out with the query cache cleared — and a wrong email and a wrong password produce byte-identical responses.

## What this teaches

| Area | Skill |
| --- | --- |
| Web | Authentication vs authorization ★★★ |
| Web | Sessions vs tokens — trade-offs ★★★ |
| Web | Hashing vs encryption ★★★ |
| Web | Cookies — HttpOnly, Secure, SameSite ★★★ |
| Web | XSS and CSRF — mechanism and prevention ★★★ |
| Web | 401 vs 403 ★★★ |
| Laravel | Sanctum, guards, token abilities |
| Laravel | Database transactions in application flow ★★★ |
| React | Context API and typed context values ★★★ |
| React | React Router — protected routes, redirects ★★★ |
| TypeScript | Discriminated unions for auth state |

## Interview questions

**Q. Where do you store the auth token and why?**

An HttpOnly, Secure, SameSite cookie via Sanctum's SPA mode, so JavaScript can never read it — an XSS bug cannot exfiltrate a reusable session. The cost is that I need CSRF protection (CSRF cookie, withCredentials, strict CORS) and the client and API must share a site. localStorage would have been simpler and would transfer straight to React Native, but the browser is the higher-risk surface, so I took the stronger web option and will add Sanctum's Bearer token path for the mobile client when it exists. See ADR 0005 — this supersedes the original plan.

**Q. Why hash rather than encrypt passwords?**

Encryption is reversible — anyone with the key recovers every password. Hashing is one-way by design, and a slow salted hash like bcrypt or Argon2id makes brute-forcing expensive. I never need the original value, only to verify a match.

**Q. What is user enumeration?**

Any behaviour that reveals whether an account exists — a distinct error message, a different status code, or a measurably different response time. I return one identical message for wrong email and wrong password, and 202 on password reset regardless.

## Search terms

- laravel sanctum spa authentication
- react typescript auth context
- xss vs csrf explained
- argon2 vs bcrypt
- user enumeration attack
