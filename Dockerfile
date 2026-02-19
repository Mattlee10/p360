# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY .npmrc ./

# Copy workspace package files
COPY packages/core/package*.json packages/core/
COPY apps/telegram/package*.json apps/telegram/

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY packages/core/src packages/core/src
COPY packages/core/tsconfig.json packages/core/
COPY apps/telegram/src apps/telegram/src
COPY apps/telegram/tsconfig.json apps/telegram/

# Build both packages
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy entire node_modules (needed for @p360/core and telegram dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built core package
COPY --from=builder /app/packages/core ./packages/core

# Copy built telegram app (including dist folder)
COPY --from=builder /app/apps/telegram ./apps/telegram

# Copy root package.json for reference
COPY --from=builder /app/package*.json ./

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Navigate to telegram app and start
WORKDIR /app/apps/telegram
CMD ["node", "dist/index.js"]
