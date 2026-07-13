# Picturesk workflow

How the whole thing works, end to end, button by button. Two journeys: the
**customer** (buying headshots) and the **admin** (staff managing the business).

## Core principle

Money in, then a slow external job we do not control. Everything is built so we
**never lose or double-run an order**. An order is a durable record in MongoDB that
moves through an explicit state machine, processed by an idempotent, resumable
worker. Payment is confirmed by a Stripe webhook (server to server), not by the
browser redirect, so a closed tab can never lose a paid order.

Order states: `AWAITING_PAYMENT -> PAID -> TRAINING -> GENERATING -> DELIVERED`.
Any non-terminal state can go to `FAILED` (which auto-refunds). `DELIVERED` and
`FAILED` are terminal.

---

## Customer journey

### 1. Landing page -> "Get started"
The homepage call to action sends the visitor to the first funnel step,
`/generator/select`. No account is needed to buy.

### 2. Select step (`/generator/select`)
They choose their **looks** (studio, in office, outdoor, and so on), **attire**,
**gender**, **age range**, and optionally **race** and **facial hair**, plus their
**email**. Every choice is saved to their browser as they go. Nothing is sent to us
yet. Press **Continue** to move to the upload step.

### 3. Upload step (`/generator/upload`)
They add photos, or press **"Use my camera"** for the guided multi-angle capture
flow (`/generator/capture`). Press **Continue**, which does two things in order:

1. **"Uploading"** — the photos go straight from their browser to our R2 storage
   using presigned URLs. The image bytes never pass through our server.
2. **"Checking your photos"** — the quality gate runs: a face is present, exactly
   one clear face, big enough, not a sunglasses or hat photo, and nothing unsafe.
   A photo that fails is flagged so they can swap it. If all pass, they go to pay.

The gate result is cached per photo, so the later checkout is instant.

### 4. Pay step (`/generator/pay`)
Shows a summary and the **$35** price. Press **"Pay and start"**:

- We create the order in MongoDB with status **AWAITING_PAYMENT**, carrying their
  choices and photo URLs.
- We create a **Stripe Checkout session** (our server sets the price, never the
  browser).
- They are redirected to **Stripe's hosted payment page**.

### 5. Stripe checkout -> "Pay"
Stripe charges the card, then redirects them to `/success?orderId=...`. Separately,
Stripe sends a signed **webhook** to our API. Payment is confirmed by that webhook,
not by the redirect.

### 6. Webhook (`POST /webhooks/stripe`, automatic)
Our API verifies the signature, then **atomically flips the order
AWAITING_PAYMENT -> PAID exactly once** and puts one job on the queue. A Stripe
retry hits the same idempotency anchor (`stripeSessionId`) and never double-runs.

### 7. The worker (automatic, the slow part)
It walks the order through the state machine, one resumable step at a time:

1. **PAID -> TRAINING**: bundles the selfies into a zip, uploads it to R2, and
   starts a Replicate fine-tune on the customer's face.
2. **TRAINING -> GENERATING**: generates a batch of candidate headshots from the
   look and attire choices (more candidates than we deliver).
3. **Selection**: scores every candidate for how much it looks like the customer's
   real selfies, keeps the best set.
4. **Face swap** (if enabled): pastes the customer's real face onto the picks, so
   the face shape, hair, and expression are truly theirs.
5. **Realism enhance** (if enabled): adds skin texture and sharpens the eyes so the
   result does not look plastic, without changing identity.
6. **Persist**: copies the final delivered images into our own R2 bucket
   (`deliveries/<orderId>/<i>`) so they do not expire with the Replicate URLs.
7. **GENERATING -> DELIVERED**, then **emails** the customer a link to their
   results.

Every external id and finished image is written to MongoDB before the next step,
so a crash reattaches to in-flight work instead of retraining or regenerating.

### 8. Success page (`/success`)
- While it is still working: it polls the API and shows progress ("generating X of
  Y") and a live timer.
- When DELIVERED: it shows the headshots with a **Download** button per image and a
  **Download all** (zip) button.
  - **Download** streams one image as a file.
  - **Download all** streams a single zip of every headshot.

Because the delivered images are persisted to our R2, these keep working
indefinitely (they do not expire an hour after delivery).

---

## Admin journey (staff)

The admin panel is a separate, staff-only area. Distinct identity (`AdminUser`),
distinct cookie (`picturesk_admin`), its own login. Two roles: **admin** (full
access) and **support** (read-only).

### Log in (`/admin/login`) -> "Sign in"
Checks email and password, sets the admin session cookie, and lands you on the
Overview. Requires `ADMIN_JWT_SECRET` on the API, otherwise login is disabled (503).

### Read-only views
- **Overview** (`/admin`): revenue, delivered margin, compute cost, counts by
  status, refunds, and how many orders are stuck.
- **Orders** (`/admin/orders`): a filterable list (by status). Click a row for the
  detail page.
- **Order detail** (`/admin/orders/:id`): everything about one order (money, the
  customer's choices, the timeline, external ids, and image grids).
- **Customers** (`/admin/customers`): one row per email with order count, delivered
  count, total spend, and whether they have an account.

Both admin and support can see all of the above.

### Order-detail action buttons (admin only)
- **Refund**: confirm, then issue a Stripe refund and mark the order refunded. It
  does not cancel an in-flight run.
- **Retry**: re-queue a stuck, paid, in-progress order so the worker reattaches.
- **Resend email**: re-send the delivery email for a delivered order.
- **Delete order**: strong confirm, then remove the order and the objects we store
  for it in R2 (uploaded selfies, training zip, persisted delivered images), and
  return to the list. Irreversible, and it drops the payment record.

### Team (`/admin/admins`, admin only)
- **New admin**: create a staff account (admin or read-only support).
- **Edit**: change name, email, role, or status.
- **Password**: reset that person's password (which signs them out).
- **Deactivate / Activate**: toggle their access.
- **Delete**: remove a staff account.

Guardrails: at least one active admin must always remain, and you cannot
deactivate, demote, or delete your own account.

### Account (`/admin/account`, any admin)
- **Save profile**: update your own name and email.
- **Change password**: update your own password.

### Log out
Clears the session cookie and returns you to the login page.

---

## Where each thing lives

- `apps/web` — the customer funnel and the admin UI (Next.js).
- `apps/api` — checkout, the Stripe webhook, the public order view, the download
  endpoints, and all `/auth`, `/admin`, and `/admin-users` routes (Express).
- `apps/worker` — the training and generation pipeline (BullMQ consumer).
- `packages/shared` — the contracts every service imports: order states, the
  Mongoose models (`Order`, `User`, `AdminUser`), the look and attire catalog, the
  queue names, storage, and email.
