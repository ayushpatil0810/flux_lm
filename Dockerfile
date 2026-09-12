# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Dependency resolution with Bun (using frozen bun.lock)
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Next.js standalone application build
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compile-time environment variables to satisfy Zod schema validation
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV BETTER_AUTH_SECRET="placeholder_secret_at_least_32_chars_long"

RUN bun run build

# ------------------------------------------------------------------------------
# Stage 3: Minimal, non-root production runtime (Node.js 20 Alpine)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat

# Create unprivileged system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and public directory
COPY --from=builder /app/public ./public

# Prepare .next directory with correct ownership for prerender caching
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone server and static assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
