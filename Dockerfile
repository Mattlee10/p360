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

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy node_modules and built code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/apps/telegram ./apps/telegram
COPY --from=builder /app/package*.json ./

# Set working directory to telegram app
WORKDIR /app/apps/telegram

# Environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Start
CMD ["npm", "start"]
