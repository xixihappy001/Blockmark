FROM node:24-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /data/wrangler

EXPOSE 3000
VOLUME ["/data/wrangler"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["pnpm", "exec", "wrangler", "dev", "--local", "--config", "dist/server/wrangler.json", "--ip", "0.0.0.0", "--port", "3000", "--persist-to", "/data/wrangler", "--log-level", "warn"]
