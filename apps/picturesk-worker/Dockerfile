# syntax=docker/dockerfile:1
# NOT YET MONOREPO-AWARE. Its COPY paths still point at the old standalone
# picturesk layout (apps/api, apps/web, apps/worker, packages/shared) and at a
# lockfile that no longer exists here. A deploy will FAIL at build until this is
# rewritten on the travel-backend pattern. Tracked as Phase 4 of the import.
#
#
# Picturesk worker (BullMQ consumer). No HTTP; it drains the order-pipeline queue.
# Build context = the monorepo root:
#   fly deploy -c fly.worker.toml
#
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# Install ONLY the worker + shared, production only. --prod is important here: it
# skips mongodb-memory-server (a test-only devDependency that downloads a Mongo
# binary), keeping the image small.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter "@travel-suite/picturesk-worker..."

COPY packages/shared packages/shared
COPY apps/worker apps/worker

ENV NODE_ENV=production
WORKDIR /app/apps/worker
CMD ["node", "index.js"]
