# Phase 09 — Security hardening across the whole surface

> **Group** Identity & isolation · **Side** API · **Risk** medium (2/3) · **Depends on** 08

**Goal.** Work through the attack surface deliberately, close what applies, and be able to name what you did and why.

## Rate limiting, tiered

- **Login:** a handful of attempts per minute, keyed on email *and* IP together, for the reason in phase 07.
- **Password reset:** tighter still — it sends email, so abuse costs you money and your sending reputation.
- **General API:** a per-tenant limit, so one agency's runaway script cannot degrade service for everyone. Keying on user rather than IP is what makes it fair behind corporate NAT.
- **Write endpoints** lower than reads.
- Return **429** with a `Retry-After` header, and handle it in the axios interceptor with a message that tells the user when to try again.

## Security headers

- **Content-Security-Policy** — the real mitigation for XSS. It still matters with an HttpOnly cookie: the session cannot be stolen, but an injected script can act as the user for as long as the page is open. Start in report-only mode, watch what breaks, then enforce.
- **Strict-Transport-Security** — once set, browsers refuse plain HTTP for your domain.
- **X-Content-Type-Options: nosniff**, **X-Frame-Options: DENY**, and a restrictive **Referrer-Policy**.
- Remove `X-Powered-By` and the server version banner. Minor, but free.
- Check the result with an online header scanner — it turns an abstract checklist into a grade you can improve.

## Input, output and the boundaries between them

- **Validate everything at the edge** in Form Requests. Never trust a client — yours included, because the API is public and anyone can call it with curl.
- **Allow-list, don't block-list.** Define what is acceptable rather than enumerating what isn't; you will never finish the second list.
- **SQL injection:** the query builder parameterises for you. `DB::raw()` with an interpolated variable opts out. If you need raw SQL, bind parameters explicitly.
- **XSS:** React escapes by default. `dangerouslySetInnerHTML` is the way back in — and if you ever need it, sanitise with DOMPurify first.
- **File uploads** (logos): validate the real MIME type rather than the extension, cap the size, generate your own filename, and store outside the web root. An uploaded `.php` served back is a full compromise.
- **Never return internal errors to the client.** `APP_DEBUG=false` in production; log the detail with the request ID and return the generic envelope.

## Dependencies and secrets

- `composer audit` and `npm audit` in CI, failing the build on high severity. Most real breaches arrive through a dependency, not your own code.
- Enable Dependabot on the repository — visible on your GitHub profile, and it is what real teams do.
- No secrets in the repo, ever. If one is committed, rotating it is the fix — deleting the file is not, because git history keeps it.
- A distinct `APP_KEY` per environment.

## Write the threat model down

`docs/threat-model.md`: who would attack this, what they would want, and what you did about it. A competitor scraping fleet data. A dishonest employee reading another agency's customers. Credential stuffing against the login. A hostile file upload. Four paragraphs is enough — the fact that the document exists is most of the signal.

## Tasks

- [ ] Tiered rate limits with per-user keys
- [ ] 429 with `Retry-After`, handled in the client
- [ ] Add all security headers, CSP report-only first
- [ ] Audit every endpoint for allow-list validation
- [ ] Grep the codebase for `DB::raw` and `dangerouslySetInnerHTML`
- [ ] Harden logo upload — real MIME, size cap, generated name
- [ ] Add `composer audit` and `npm audit` to CI
- [ ] Enable Dependabot
- [ ] Log auth events with request ID, never credentials
- [ ] Write `docs/threat-model.md`

## Done when

An external header scanner grades your domain well, `composer audit` and `npm audit` pass in CI, brute-forcing login returns 429 with `Retry-After`, and `docs/threat-model.md` exists and is honest.

## What this teaches

| Area | Skill |
| --- | --- |
| Web | OWASP Top 10 ★★★ |
| Web | XSS, CSRF, SQL injection, IDOR ★★★ |
| Web | Content-Security-Policy and security headers ★★★ |
| Web | HTTPS, TLS, HSTS ★★★ |
| Web | Rate limiting and abuse prevention ★★★ |
| Laravel | Form request validation, custom rules ★★★ |
| Laravel | Secure file uploads |
| DevOps | Dependency auditing, Dependabot |
| DevOps | Secret management and rotation ★★★ |
| Architecture | Threat modelling |

## Interview questions

**Q. Walk me through how you secured this application.**

Layered. At the edge: tiered rate limiting, CSP and HSTS, forced HTTPS. At the boundary: allow-list validation in form requests and Zod parsing on the client. At the data layer: tenant scoping plus policies, parameterised queries, no agency_id in fillable. Operationally: dependency audits in CI, no secrets in the repo, APP_DEBUG off, and auth events logged with a request ID. It's written up in docs/threat-model.md.

**Q. How do you protect the session against XSS and CSRF?**

The session cookie is HttpOnly, so an injected script cannot read it — that closes token theft, but not XSS itself, since a script can still act as the user while the page is open. So React escapes output by default, I never use dangerouslySetInnerHTML, and a Content-Security-Policy blocks inline and third-party scripts. Because the browser attaches the cookie automatically I also need CSRF protection: SameSite plus Sanctum's CSRF token.

**Q. Why key the login limiter on email and IP together?**

IP alone lets an attacker rotate addresses and keep guessing one account. Email alone lets an attacker lock a real customer out on purpose. The pair limits guessing at one account from one source without creating a denial-of-service against your own users.

## Search terms

- owasp top 10 2025 explained
- content security policy tutorial
- laravel rate limiting throttle
- secure file upload vulnerabilities
- laravel security best practices
