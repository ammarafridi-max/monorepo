# syntax=docker/dockerfile:1
#
# Picturesk worker (BullMQ). Build context = the MONOREPO ROOT so pnpm can resolve
# the workspace dependencies:
#   fly deploy -c fly.picturesk-worker.toml     (run from the repo root)
#
# No public service: it drains the order-pipeline queue continuously.
#
FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

# ca-certificates for the outbound HTTPS calls to Replicate, R2, Stripe, and Brevo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

# ── Install dependencies (cached separately from source) ─────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# THIS LIST IS LOAD-BEARING — see the api Dockerfile. Add a line whenever the
# worker gains a workspace dependency.
COPY packages/picturesk-shared/package.json  packages/picturesk-shared/package.json
COPY apps/picturesk-worker/package.json      apps/picturesk-worker/package.json

# NOT --prod. pnpm links a workspace package's PEER dependencies through its
# devDependencies, so --prod leaves @travel-suite/auth without mongoose and the
# api dies at boot with ERR_MODULE_NOT_FOUND. The travel backends install the
# same way for the same reason.
#
# The one devDependency that matters here is mongodb-memory-server, whose
# postinstall downloads a ~100MB mongod binary for the test suite. Disable that
# rather than the install itself.
ENV MONGOMS_DISABLE_POSTINSTALL=1
RUN pnpm install --frozen-lockfile

# ── Runtime image ────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /repo

COPY packages/ packages/
COPY apps/picturesk-worker/ apps/picturesk-worker/

ENV NODE_ENV=production

WORKDIR /repo/apps/picturesk-worker
# Not `pnpm start`: that script loads .env.production, which does not exist in the
# image. Config comes from Fly secrets in the environment.
CMD ["node", "index.js"]
