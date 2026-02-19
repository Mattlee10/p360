# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy monorepo structure FIRST (to establish workspaces)
COPY package*.json ./
COPY .npmrc ./
COPY packages/core/package*.json packages/core/
COPY apps/telegram/package*.json apps/telegram/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/core packages/core
COPY apps/telegram apps/telegram

# Build core and telegram
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/packages/core packages/core
COPY --from=builder /app/apps/telegram apps/telegram

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Start telegram bot
EXPOSE 3000
CMD ["bash", "-c", "cd apps/telegram && npm start"]
