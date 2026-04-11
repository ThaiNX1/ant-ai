# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy workspace source
COPY tsconfig.base.json nx.json ./
COPY libs/ libs/
COPY apps/customer-service/ apps/customer-service/

# Build customer-service with Nx
RUN npx nx build customer-service --configuration=production

# ---- Production Stage ----
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PORT=8082

WORKDIR /app

# Copy compiled output (app + lib directories) and runtime dependencies
COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules/ ./node_modules/

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8082

# Health check for Fargate readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/cs/health || exit 1

# NestJS with Fastify handles SIGTERM natively for graceful shutdown
CMD ["node", "dist/apps/customer-service/src/main.js"]
