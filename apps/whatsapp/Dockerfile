FROM node:20-alpine

WORKDIR /app

# Copy monorepo root
COPY package.json ./

# Copy packages/core
COPY packages/core ./packages/core

# Copy apps/whatsapp
COPY apps/whatsapp ./apps/whatsapp

# Build core first
WORKDIR /app/packages/core
RUN npm install && npm run build

# Build whatsapp
WORKDIR /app/apps/whatsapp
RUN npm install && npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
