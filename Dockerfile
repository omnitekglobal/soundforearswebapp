FROM node:22-slim AS builder

WORKDIR /app

# Install system dependencies (OpenSSL for Prisma, etc.)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY . .

# Generate Prisma client and build Next.js app
RUN npx prisma generate && npm run build


FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install system dependencies (OpenSSL for Prisma runtime)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package metadata and install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built app and Prisma schema
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma

# Next.js uses this port by default
ENV PORT=3000
EXPOSE 3000

# Run migrations (or db push) then start the app
CMD sh -c "npx prisma migrate deploy || npx prisma db push; npm run start"

