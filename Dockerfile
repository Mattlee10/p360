# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy monorepo structure
COPY package*.json ./
COPY .npmrc ./

# Install only core and telegram dependencies
RUN npm install --workspace=packages/core --workspace=apps/telegram

# Copy source code
COPY packages/core packages/core
COPY apps/telegram apps/telegram

# Build core and telegram only
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
