# picturesk-frontend

## What this is

The Next.js frontend for Picturesk.ai, an AI headshot generator. It carries the
marketing pages, the upload/checkout funnel under `/ai-headshot-generator`, the
customer account area, and the admin dashboard. It talks to `picturesk-backend` at
`NEXT_PUBLIC_API_BASE_URL`; the browser uploads selfies directly to R2 via
presigned URLs, so photo bytes never pass through this app.

## HARD RULE

**Before doing ANY UI, design, styling, layout, or user-facing copy work, you
MUST read `../../docs/picturesk/BRAND.md` and follow it. Never design without
consulting BRAND.md first.**

## SEO metadata rules

Whenever you write or edit a page `<title>` or meta description (including
`buildMetadata` calls in `lib/schema.js` and per-page `metadata` exports):

- **Title: at most 60 characters, spaces included.** Strictly 60, never more.
- **Meta description: at most 160 characters, spaces included.** Strictly 160,
  never more.
- Both must contain the page's primary keyword. The home page's primary keyword
  is **"AI Headshot Generator"**.
- No em dashes (already required for all user-facing copy).

Always count the characters (spaces included) and confirm the limits before
finishing.

## Two surfaces, two styling systems

`app/(site)` is the customer-facing site: plain CSS with the Forest & Gold tokens
in `app/globals.css`, no Tailwind. `app/admin` is the staff dashboard: the shared
`@travel-suite/frontend-shared` admin UI, which is Tailwind v4.

They are separate route groups on purpose. `globals.css` is imported by
`(site)/layout.js`, never the root layout, so it cannot reach `/admin`. That
matters: its unlayered `a { color: var(--cobalt) }` beats every Tailwind utility
(unlayered CSS wins over layered), and `--cobalt` is the same green as the admin
sidebar's active pill, so the active nav item rendered green-on-green. Do not
move the stylesheet back up to the root layout.

Tailwind lives in `app/admin/admin.css`, scoped to that subtree, with Picturesk's
green as `primary` so the shared design system carries the brand.

## Admin

The dashboard shell, login, staff CRUD, and My Account come from
`@travel-suite/frontend-shared`. Orders, Customers, and the Dashboard are
Picturesk's own pages, built to match the shared conventions. Before touching any
of them, read `packages/frontend-shared/src/pages/admin/AdminInsuranceApplicationsPage.js`
— it is the reference every admin page in this monorepo follows.

The shared UI reads `NEXT_PUBLIC_BACKEND_URL` and calls the api under `/api`;
Picturesk's own admin data goes through `lib/adminApi.js` on the same origin.

## Stack and conventions

- JavaScript, ESM everywhere. No TypeScript. JSDoc typedefs, not TS types.
- Server-side code here uses Mongoose directly against the same MongoDB as the
  api (customer accounts, order linking). `jose` sessions, separate from the
  admin cookie the api issues.
- No em dashes in any user-facing copy.
