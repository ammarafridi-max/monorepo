# Headliner

AI headshot generator: upload selfies, pay once (~$35), we fine-tune a model on
your face via Replicate, generate professional headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/web` - Next.js frontend (Phase 4, placeholder for now).
- `apps/api` - Express service for Stripe (Phase 1-2, placeholder for now).
- `apps/worker` - BullMQ worker for Replicate (Phase 1-3, placeholder for now).
- `packages/shared` - shared order contracts. The Phase 0 deliverable.

## Getting started

```sh
pnpm install
cp .env.example .env   # then fill in values
```

Nothing is runnable yet beyond the shared contracts. This is **Phase 0**
(contracts only).

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
