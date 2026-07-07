# Headliner

AI headshot generator: upload selfies, pay once (~$35), we fine-tune a model on
your face via Replicate, generate professional headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/web` - Next.js frontend (Phase 4, placeholder for now).
- `apps/api` - Express service: produces pipeline jobs (Phase 1). Real Stripe in Phase 2.
- `apps/worker` - BullMQ worker: drives orders through the pipeline (Phase 1). Real Replicate in Phase 3.
- `packages/shared` - shared order contracts, the atomic transition helper, and the Redis connection helper.

## Getting started

```sh
pnpm install
cp .env.example .env   # then fill in values
```

## Running Phase 1 (walking skeleton)

Phase 1 moves one **fake** order through the full pipeline (api -> queue ->
worker -> Mongo) with every external call stubbed. There is no Stripe, no
Replicate, and no UI yet.

**Requires a running MongoDB and Redis.** Set both in `.env`:

- `MONGODB_URI` - e.g. `mongodb://127.0.0.1:27017/headliner`
- `REDIS_URL` - e.g. `redis://127.0.0.1:6379`

Start the api and worker together:

```sh
pnpm dev
```

Then push a fake order through the pipeline and watch its status advance
(`PAID -> TRAINING -> GENERATING -> DELIVERED`, about 5 seconds):

```sh
curl -s -X POST localhost:3001/test/orders \
  -H 'content-type: application/json' \
  -d '{"customerEmail":"test@example.com"}'
# -> { "orderId": "..." }

curl -s localhost:3001/orders/<orderId>   # poll to watch status change
```

`POST /test/orders` fakes Stripe and is removed in Phase 2. You can also run the
services separately with `pnpm api` and `pnpm worker`.

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
