# Build frontend + compile server
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime: Node serves dist/ + /api/*
FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

COPY package.json pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/src/data/catalog.json ./src/data/catalog.json

VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "dist-server/index.js"]
