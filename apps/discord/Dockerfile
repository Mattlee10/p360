FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN npm install

# Build discord app
RUN cd apps/discord && npm run build

# Start discord app
WORKDIR /app/apps/discord
CMD ["npm", "start"]
