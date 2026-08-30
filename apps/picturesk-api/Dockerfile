# syntax=docker/dockerfile:1
# NOT YET MONOREPO-AWARE. Its COPY paths still point at the old standalone
# picturesk layout (apps/api, apps/web, apps/worker, packages/shared) and at a
# lockfile that no longer exists here. A deploy will FAIL at build until this is
# rewritten on the travel-backend pattern. Tracked as Phase 4 of the import.
#
#
# Picturesk API (Express). Build context = the MONOREPO ROOT so pnpm can resolve
# the @travel-suite/picturesk-shared workspace dependency:
#   fly deploy -c fly.api.toml            (runs from the repo root)
#
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# Install ONLY the api and its workspace deps (shared), production only. Copy the
# manifests first so this layer caches until a package.json / lockfile changes.
# --prod skips devDependencies (e.g. the worker's mongodb-memory-server).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter "@travel-suite/picturesk-api..."

# App source.
COPY packages/shared packages/shared
COPY apps/api apps/api

ENV NODE_ENV=production PORT=3001
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "server.js"]
