# 0002 — API-only backend

## Context

More work if you work normally with Blade and want to scale and make a mobile app.

## Decision

I decided backend API with Laravel only and React for frontend. It is better to have everything have its specialisation, and good for scale and organised.

## Consequences

More work and new for me. About 40% more than Blade pages: CORS between the two apps, token storage in the browser, and validation written twice — Laravel Form Request and Zod.

But less work in future, new knowledge, and more organised and scalable. A React Native app can reuse the same backend with no rewrite.

## Status

Accepted, 2026-08-21.
