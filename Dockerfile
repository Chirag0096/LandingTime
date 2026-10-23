FROM node:22-slim

WORKDIR /app
ENV PORT=8080

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build client
COPY . .
RUN npm run build

# Expose port (Cloud Run uses PORT env var, defaults to 8080)
EXPOSE 8080

# Start unified frontend and MCP backend
CMD ["npx", "tsx", "server/src/server.ts"]
