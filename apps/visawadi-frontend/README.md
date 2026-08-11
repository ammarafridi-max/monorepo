# visawadi-frontend

Next.js App Router frontend for **VisaWadi**, a visa-only brand serving UAE residents. Part of the `travel-suite` monorepo; shared UI and data services come from `@travel-suite/frontend-shared`.

VisaWadi handles visa applications and nothing else — no travel insurance, travel itineraries, dummy flight tickets or hotel reservations.

## Status

Public site and admin are both built. Live domain is **`https://www.visawadi.com`**, backend at `https://api.visawadi.com`.

Outstanding before launch: brand logo and favicon (still the other brand's files), an `og-image.png`, a legal review of `/privacy-policy` and `/terms-and-conditions`, and real values for `ADDRESS` / `GMB_URL` / `SOCIALS` in `src/config/contact.js`.

## Running it

Node 22, pnpm 9. From the repo root:

```bash
pnpm install
pnpm turbo dev --filter=visawadi-frontend
```

It expects `visawadi-backend` to be running and reachable at `NEXT_PUBLIC_BACKEND_URL`.

## Admin section

| Route | Purpose |
|---|---|
| `/admin` | Dashboard: visa leads, applications, blog counts |
| `/admin/visa-leads` | Consultation enquiries |
| `/admin/visa-applications` | Applications, applicants, documents |
| `/admin/document-registry` | Document types and checklist templates |
| `/admin/visa` | Visa landing pages |
| `/admin/blog`, `/admin/blog-tags` | Blog content |
| `/admin/revenue`, `/admin/payment-links`, `/admin/products`, `/admin/currencies` | Finance |
| `/admin/users`, `/admin/account` | People and settings |

Pages are thin re-exports of shared `pages/admin/*` components. Change behaviour in the shared component, not here.

## Environment

`NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_TINYMCE_API_KEY`.

## Public routes

| Route | Purpose |
|---|---|
| `/` | Visa-led homepage |
| `/visa`, `/visa/[slug]` | Visa listing and detail pages (ISR) |
| `/blog`, `/blog/[slug]`, `/blog/tags`, `/blog/tags/[slug]` | Blog |
| `/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms-and-conditions` | Static pages |
| `/apply`, `/apply/login`, `/apply/[applicationRef]` | Customer document upload (`noindex`, reached via emailed magic link) |

## Deployment

Fly.io, built from `apps/visawadi-frontend/Dockerfile` with a repo-root build context:

```bash
flyctl deploy -c fly.visawadi-frontend.toml --remote-only
```
