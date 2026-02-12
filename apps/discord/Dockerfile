FROM node:20-alpine

WORKDIR /app

# Copy docker-specific package.json (without @p360/core file: dependency)
COPY package.docker.json ./package.json

# Install production dependencies
RUN npm install --omit=dev

# Copy pre-built @p360/core (resolved from monorepo symlink)
COPY .core-bundle/ ./node_modules/@p360/core/

# Copy pre-built app (named build-output to avoid .gitignore dist/ rule)
COPY build-output/ ./dist/

# Run the bot
CMD ["node", "dist/index.js"]
