FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY packages/shared/utils/package.json                  packages/shared/utils/package.json
COPY packages/domains/auth/package.json                  packages/domains/auth/package.json
COPY packages/domains/admin-users/package.json           packages/domains/admin-users/package.json
COPY packages/domains/blog/package.json                  packages/domains/blog/package.json
COPY packages/integrations/cloudinary/package.json       packages/integrations/cloudinary/package.json
COPY packages/domains/currencies/package.json            packages/domains/currencies/package.json
COPY packages/domains/locations/package.json             packages/domains/locations/package.json
COPY packages/domains/payments/package.json              packages/domains/payments/package.json
COPY packages/domains/vehicles/package.json              packages/domains/vehicles/package.json
COPY packages/domains/zones/package.json                 packages/domains/zones/package.json
COPY packages/domains/pricing-rules/package.json         packages/domains/pricing-rules/package.json
COPY packages/domains/availability-rules/package.json    packages/domains/availability-rules/package.json
COPY packages/domains/limo-bookings/package.json         packages/domains/limo-bookings/package.json
COPY apps/emirateslimo-backend/package.json              apps/emirateslimo-backend/package.json

RUN pnpm install --frozen-lockfile

# ── Runtime image ────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /repo

COPY packages/ packages/
COPY apps/emirateslimo-backend/ apps/emirateslimo-backend/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
WORKDIR /repo/apps/emirateslimo-backend
CMD ["node", "src/server.js"]
