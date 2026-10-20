FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca --mount=type=cache,target=/tmp/npm-cache \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --ignore-scripts --cache /tmp/npm-cache --no-audit --no-fund --fetch-timeout=30000 --fetch-retries=2 --maxsockets=8
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY --chmod=644 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
