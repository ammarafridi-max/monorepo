FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY packages/auth/package.json            packages/auth/package.json
COPY packages/admin-users/package.json     packages/admin-users/package.json
COPY packages/affiliates/package.json      packages/affiliates/package.json
COPY packages/blog/package.json            packages/blog/package.json
COPY packages/cloudinary/package.json      packages/cloudinary/package.json
COPY packages/currencies/package.json      packages/currencies/package.json
COPY packages/flights/package.json         packages/flights/package.json
COPY packages/notifications/package.json   packages/notifications/package.json
COPY packages/payments/package.json        packages/payments/package.json
COPY packages/tickets/package.json         packages/tickets/package.json
COPY packages/users/package.json           packages/users/package.json
COPY packages/utils/package.json           packages/utils/package.json
COPY apps/dt365-backend/package.json       apps/dt365-backend/package.json

RUN pnpm install --frozen-lockfile

# ── Runtime image ────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /repo

COPY packages/ packages/
COPY apps/dt365-backend/ apps/dt365-backend/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
WORKDIR /repo/apps/dt365-backend
CMD ["node", "src/server.js"]
