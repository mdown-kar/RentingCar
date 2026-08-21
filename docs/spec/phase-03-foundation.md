# Phase 03 — Laravel API skeleton with static analysis from commit one

> **Group** Foundation · **Side** API · **Risk** low (1/3) · **Depends on** 02

**Goal.** A strict, lint-clean, statically-analysed Laravel API that returns JSON and refuses to accept sloppy code.

## Install

```
composer create-project laravel/laravel api
cd api
php artisan install:api          # routes/api.php + Sanctum

composer require --dev larastan/larastan
composer require --dev laravel/pint
composer require --dev rector/rector
```

## Set the quality floor now, not later

- **`declare(strict_types=1);`** at the top of every PHP file. Without it, PHP quietly coerces `"5 days"` to `5`. With it, that's a fatal error at the boundary where you can still see it.
- **Larastan at level 6, rising to 8.** It catches undefined properties, wrong argument types and impossible conditions before the code ever runs. Turning it on at the end of a project is a week of pain; turning it on now costs nothing.
- **Laravel Pint** for formatting. Never argue about style again, and never produce a diff that is 90% whitespace.
- **PHP 8.3 features on purpose:** readonly properties, enums, constructor promotion, named arguments, `match`. Using them signals you've kept up.
- All four run in CI in phase 20. Set them up here so the pipeline is trivial to add later.

## Shape the API properly from the start

- **Version the URL: `/api/v1/...`**. It costs nothing today and it is the only cheap moment to do it. An unversioned public API is a promise you can never break.
- **One consistent error envelope** for every failure, defined in `api.md` and produced by a single exception handler — not invented per controller.
- **Force JSON responses.** An API that renders an HTML error page when something breaks will confuse every client you ever write.
- **A request ID** generated in middleware, attached to every log line and returned in a response header. In phase 18 this is what lets you trace one user's failed request through the whole system.

## The error envelope

```
{
  "message": "The given data was invalid.",
  "errors":  { "plate_number": ["This plate already exists in your fleet."] },
  "request_id": "01JB2K9F7XW3QE8T"
}
```

## Where things live in Laravel 11/12

- `bootstrap/app.php` — middleware, exception handling and routing registration. **Not** `app/Http/Kernel.php`; that was removed in Laravel 11.
- `routes/api.php` — automatically prefixed with `/api`. A very common source of phantom 404s.
- `app/Http/Resources`, `app/Http/Requests`, `app/Policies`, `app/Services` — you will live in these four.

## Warning

> Most Laravel material online targets versions 8–10. Middleware registration, the API install step and the exception handler all changed in 11. Check the version in the video title before you follow along, or you'll debug a tutorial instead of your app.

## Tasks

- [ ] Install Laravel 12 and run `install:api`
- [ ] Add Larastan, Pint and Rector
- [ ] `declare(strict_types=1)` everywhere
- [ ] Configure the `/api/v1` prefix
- [ ] Force JSON responses and a single error envelope
- [ ] Request-ID middleware, logged and returned
- [ ] Verify `/api/v1/ping` and commit

## Done when

`/api/v1/ping` returns JSON with a request ID header, Larastan passes at level 6, and you can trace what happens between the request arriving and the response leaving.

## What this teaches

| Area | Skill |
| --- | --- |
| Laravel | MVC and the request lifecycle ★★★ |
| Laravel | Routing, route model binding ★★★ |
| Laravel | Middleware — registration in bootstrap/app.php ★★★ |
| Laravel | Service container and dependency injection ★★★ |
| PHP | Modern PHP 8 — enums, readonly, match, typed properties ★★★ |
| PHP | Composer, PSR-4, PSR-12 |
| Testing | Static analysis as a form of testing |

## Interview questions

**Q. What does strict_types actually do?**

It disables PHP's silent scalar coercion for that file, so passing a string where an int is declared throws a TypeError instead of quietly casting. It moves a class of bugs from runtime surprise to immediate failure.

**Q. How do you enforce code quality on a team?**

Static analysis and formatting in CI, not in code review. Larastan and Pint run on every pull request, so review time is spent on design rather than style.

## Search terms

- laravel 12 api tutorial
- larastan setup laravel
- php 8.3 new features
- api versioning best practices
