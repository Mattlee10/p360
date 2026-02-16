FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy the telegram app
COPY apps/telegram ./apps/telegram

# Copy packages (core)
COPY packages ./packages

# Install dependencies
RUN npm install

# Build
RUN cd apps/telegram && npm run build

# Start
ENTRYPOINT ["sh", "-c", "cd apps/telegram && npm start"]
