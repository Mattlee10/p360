FROM node:20-alpine

WORKDIR /app

# Copy monorepo root
COPY package.json ./

# Copy packages/core
COPY packages/core ./packages/core

# Copy apps/slack
COPY apps/slack ./apps/slack

# Build core first
WORKDIR /app/packages/core
RUN npm install && npm run build

# Build slack
WORKDIR /app/apps/slack
RUN npm install && npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
