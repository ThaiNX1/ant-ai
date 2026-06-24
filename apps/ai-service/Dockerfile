# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy workspace source
COPY tsconfig.base.json nx.json ./
COPY libs/ libs/
COPY apps/ai-service/ apps/ai-service/

# Build ai-service with Nx
RUN npx nx build ai-service --configuration=production

# ---- Production Stage ----
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PORT=8081

WORKDIR /app

# Copy compiled output (app + lib directories) and runtime dependencies
COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules/ ./node_modules/

# Nx preserves workspace import names (for example @ai-platform/ai-core)
# in the compiled CommonJS output. Expose built workspace libs through
# node_modules so Node can resolve those package names at runtime.
RUN mkdir -p node_modules/@ai-platform && \
  ln -s /app/dist/libs/ai-core node_modules/@ai-platform/ai-core && \
  ln -s /app/dist/libs/common node_modules/@ai-platform/common && \
  if [ -d /app/dist/libs/database ]; then ln -s /app/dist/libs/database node_modules/@ai-platform/database; fi && \
  if [ -d /app/dist/libs/backend-client ]; then ln -s /app/dist/libs/backend-client node_modules/@ai-platform/backend-client; fi

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8081

# Health check for Fargate readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# NestJS with Fastify handles SIGTERM natively for graceful shutdown
CMD ["node", "dist/apps/ai-service/src/main.js"]
