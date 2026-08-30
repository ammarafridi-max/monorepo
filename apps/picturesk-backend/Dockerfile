# syntax=docker/dockerfile:1
#
# Picturesk backend. ONE image, TWO entrypoints:
#   server  Express: uploads, checkout, the Stripe webhook, admin
#   worker  BullMQ consumer driving an order through the pipeline
#
# They stay separate Fly apps on purpose. The server auto-suspends on idle HTTP
# and scales on request load; the worker must run continuously at concurrency 1,
# needs more memory to build a training zip, and must not be restarted by a
# deploy triggered by a web change. Same code, same image, different lifecycles.
#
#   fly deploy -c fly.picturesk-api.toml       (run from the repo root)
#   fly deploy -c fly.picturesk-worker.toml
#
FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

# sharp (the face detector's image preprocessing) ships prebuilt glibc binaries,
# so debian-slim needs no build toolchain. ca-certificates is required for the
# outbound HTTPS calls to Stripe, Replicate, R2, and Brevo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

# ── Install dependencies (cached separately from source) ─────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# THIS LIST IS LOAD-BEARING. pnpm links a package's peer dependencies only if its
# manifest is present at install time, so a workspace package missing from here
# installs fine and then dies at boot with ERR_MODULE_NOT_FOUND. Add a line
# whenever the backend gains a workspace dependency.
COPY packages/shared/utils/package.json        packages/shared/utils/package.json
COPY packages/domains/auth/package.json        packages/domains/auth/package.json
COPY packages/domains/admin-users/package.json packages/domains/admin-users/package.json
COPY packages/picturesk-shared/package.json    packages/picturesk-shared/package.json
COPY apps/picturesk-backend/package.json       apps/picturesk-backend/package.json

# NOT --prod. pnpm links a workspace package's PEER dependencies through its
# devDependencies, so --prod leaves @travel-suite/auth without mongoose and the
# server dies at boot with ERR_MODULE_NOT_FOUND.
#
# The one devDependency that matters here is mongodb-memory-server, whose
# postinstall downloads a ~100MB mongod binary for the test suite. Disable that
# rather than the install itself.
ENV MONGOMS_DISABLE_POSTINSTALL=1
RUN pnpm install --frozen-lockfile

# ── Source, shared by both entrypoints ───────────────────────────────────────
FROM deps AS runtime
WORKDIR /repo

COPY packages/ packages/
COPY apps/picturesk-backend/ apps/picturesk-backend/

ENV NODE_ENV=production
WORKDIR /repo/apps/picturesk-backend

# Both fly configs name their stage with `build-target`, so neither depends on
# stage order. `server` is still last so a bare `docker build` gets the HTTP app
# rather than a worker.

# ── Entrypoint: queue worker ─────────────────────────────────────────────────
# build-target = "worker". No port and no health check: it exposes no HTTP.
FROM runtime AS worker
CMD ["node", "src/worker.js"]

# ── Entrypoint: HTTP server ──────────────────────────────────────────────────
# build-target = "server".
FROM runtime AS server
ENV PORT=3001
EXPOSE 3001
# Not `pnpm start`: that script loads .env.production, which does not exist in
# the image. Config comes from Fly secrets in the environment.
CMD ["node", "src/server.js"]
