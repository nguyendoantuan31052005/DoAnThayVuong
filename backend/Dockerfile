FROM node:24-bookworm-slim AS build
WORKDIR /app/backend
ENV DATABASE_URL=file:/tmp/build.db
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN --mount=type=secret,id=proxy_ca --mount=type=cache,target=/tmp/npm-cache \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --ignore-scripts --cache /tmp/npm-cache --no-audit --no-fund --fetch-timeout=30000 --fetch-retries=2 --maxsockets=8
COPY src ./src
RUN npm run db:generate && npm run build && npm prune --omit=dev --ignore-scripts --cache /tmp/npm-cache --no-audit --no-fund

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 DATABASE_URL=file:/data/phishing.db
WORKDIR /app/backend
COPY --from=build --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/dist ./dist
COPY --chown=node:node package.json package-lock.json prisma.config.ts ./
COPY --chown=node:node prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=node:node prisma/migrations ./prisma/migrations
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node -e \"require('dotenv/config'); require('./dist/config').validateConfig()\" && npm run db:migrate && node dist/main.js"]
