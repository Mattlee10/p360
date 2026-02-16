FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN npm install

# Build telegram app
RUN cd apps/telegram && npm run build

# Start telegram app
WORKDIR /app/apps/telegram
CMD ["npm", "start"]
