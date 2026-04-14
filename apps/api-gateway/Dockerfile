# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json nx.json ./
COPY libs/ libs/
COPY apps/api-gateway/ apps/api-gateway/

RUN npx nx build api-gateway --configuration=production

# ---- Production Stage ----
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules/ ./node_modules/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

CMD ["node", "dist/apps/api-gateway/src/main.js"]
