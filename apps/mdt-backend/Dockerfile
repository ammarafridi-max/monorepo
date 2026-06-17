FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY packages/domains/admin-users/package.json     packages/domains/admin-users/package.json
COPY packages/domains/affiliates/package.json      packages/domains/affiliates/package.json
COPY packages/domains/auth/package.json            packages/domains/auth/package.json
COPY packages/domains/blog/package.json            packages/domains/blog/package.json
COPY packages/integrations/cloudinary/package.json      packages/integrations/cloudinary/package.json
COPY packages/domains/currencies/package.json      packages/domains/currencies/package.json
COPY packages/domains/flights/package.json         packages/domains/flights/package.json
COPY packages/integrations/airlabs/package.json    packages/integrations/airlabs/package.json
COPY packages/domains/insurance/package.json       packages/domains/insurance/package.json
COPY packages/integrations/wis/package.json        packages/integrations/wis/package.json
COPY packages/shared/notifications/package.json   packages/shared/notifications/package.json
COPY packages/domains/payments/package.json        packages/domains/payments/package.json
COPY packages/domains/tickets/package.json         packages/domains/tickets/package.json
COPY packages/domains/users/package.json           packages/domains/users/package.json
COPY packages/shared/utils/package.json           packages/shared/utils/package.json
COPY apps/mdt-backend/package.json         apps/mdt-backend/package.json

RUN pnpm install --frozen-lockfile

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /repo

COPY packages/ packages/
COPY apps/mdt-backend/ apps/mdt-backend/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
WORKDIR /repo/apps/mdt-backend
CMD ["node", "src/server.js"]
