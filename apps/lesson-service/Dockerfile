# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json nx.json ./
COPY libs/ libs/
COPY apps/lesson-service/ apps/lesson-service/

RUN npx nx build lesson-service --configuration=production

# ---- Production Stage ----
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PORT=8083

WORKDIR /app

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules/ ./node_modules/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8083

CMD ["node", "dist/apps/lesson-service/src/main.js"]
