FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy the discord app
COPY apps/discord ./apps/discord

# Copy packages (core)
COPY packages ./packages

# Install dependencies
RUN npm install

# Build
RUN cd apps/discord && npm run build

# Start
ENTRYPOINT ["sh", "-c", "cd apps/discord && npm start"]
