# picturesk-frontend

The Next.js frontend (App Router) for Picturesk.ai: the marketing pages, the
keyword landing pages, the blog, the upload and checkout funnel, the customer
account area, and the admin dashboard.

Before any UI, design, styling, layout or copy work, read
`../../docs/picturesk/BRAND.md`. See `CLAUDE.md` in this directory for the hard
rule and for the SEO limits on titles and meta descriptions.

## Flow

- `/` 308-redirects to `/ai-headshot-generator`, the canonical product page.
- `/ai-headshot-generator/select` -> `/upload` -> `/payment`: pick looks and plan,
  upload selfies (presigned, straight to R2, so bytes never touch this app), then
  create the order and redirect to Stripe.
- `/success?orderId=...&t=...` (Stripe `success_url`): polls `GET /orders/:id` and
  walks paid -> training -> generating -> delivered, then shows the results grid
  with per-image download. `t` is the order's access token.
- `/cancel` (Stripe `cancel_url`): calm "no charge" page back to the order.

## Landing pages

`/linkedin-headshots`, `/real-estate-agent-headshots` and `/pricing` are built
from a content object in `data/pages/`, rendered through the same prop-driven
sections the home page uses. Adding one means a data file, a `page.js` that
composes sections, and a line in `app/sitemap.js`.

## Run

```sh
pnpm dev     # http://localhost:3000
pnpm build
```

The backend must be running and `NEXT_PUBLIC_BACKEND_URL` must point at it, or
`/blog` renders empty.
