FROM node:20-alpine AS builder

# build dependencies (sqlite needs this)
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# FIX: downgrade pnpm to Node 20 compatible version
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json tsconfig.json ./

# install dependencies
RUN pnpm install

COPY src ./src

RUN pnpm build


# ----------------------------
# Runner stage
# ----------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache sqlite wget

WORKDIR /app

# FIX: match pnpm version (or remove entirely since not needed at runtime)
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# persistent data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    API_DATA_DIR=/app/data

EXPOSE 8080

# safer healthcheck (wget is now installed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
