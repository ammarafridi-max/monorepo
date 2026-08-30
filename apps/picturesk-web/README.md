# picturesk-web

The Next.js frontend (App Router), built in **Phase 4 (delivery + UI)**. Styled
per the root `BRAND.md`: bone/ink surfaces, cobalt as the single accent, Fraunces
serif display + Inter body, verdict-first copy, photos as the loud element.

Before any UI, design, styling, layout, or copy work here, read `BRAND.md` first.
See root `CLAUDE.md` for the hard rule.

## Flow

- `/` upload: dropzone + email + one CTA. On submit it presigns uploads, PUTs the
  photos DIRECTLY to R2, calls `POST /checkout`, then redirects to Stripe.
- `/success?orderId=...` (Stripe `success_url`): polls `GET /orders/:id` and walks
  paid -> training -> generating -> delivered, then shows the results grid with
  per-image download.
- `/cancel` (Stripe `cancel_url`): calm "no charge" page back to the order.

## Env

- `NEXT_PUBLIC_API_BASE_URL` - the Express api origin (default `http://localhost:3001`).

## Run

```sh
pnpm --filter picturesk-web dev   # http://localhost:3000
```

The api (`pnpm api`) must be running, and its `WEB_BASE_URL` must point back here
so Stripe returns to `/success`.
