# syntax=docker/dockerfile:1
#
# Picturesk API (Express). Build context = the MONOREPO ROOT so pnpm can resolve
# the workspace dependencies:
#   fly deploy -c fly.picturesk-api.toml     (run from the repo root)
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
# whenever the api gains a workspace dependency.
COPY packages/shared/utils/package.json        packages/shared/utils/package.json
COPY packages/domains/auth/package.json        packages/domains/auth/package.json
COPY packages/domains/admin-users/package.json packages/domains/admin-users/package.json
COPY packages/picturesk-shared/package.json    packages/picturesk-shared/package.json
COPY apps/picturesk-api/package.json           apps/picturesk-api/package.json

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
COPY apps/picturesk-api/ apps/picturesk-api/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
WORKDIR /repo/apps/picturesk-api
# Not `pnpm start`: that script loads .env.production, which does not exist in the
# image. Config comes from Fly secrets in the environment.
CMD ["node", "server.js"]
