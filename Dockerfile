# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all package.json and lock files FIRST
COPY package*.json ./
COPY .npmrc ./
COPY packages/core/package*.json packages/core/
COPY apps/telegram/package*.json apps/telegram/

# Install dependencies (only for workspaces we need)
RUN npm install --legacy-peer-deps

# Copy source code
COPY packages/core/src packages/core/src
COPY packages/core/tsconfig.json packages/core/
COPY apps/telegram/src apps/telegram/src
COPY apps/telegram/tsconfig.json apps/telegram/

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
