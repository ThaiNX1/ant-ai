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

# Copy built output (includes generated package.json from Nx webpack build)
COPY --from=build /app/dist/apps/ai-service ./

# Install production-only dependencies from the generated package.json
RUN npm ci --omit=dev && npm cache clean --force

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8081

# Health check for Fargate readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# NestJS with Fastify handles SIGTERM natively for graceful shutdown
CMD ["node", "main.js"]
