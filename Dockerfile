# Multi-stage Dockerfile for Landing Time
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client
COPY . .
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy build artifacts and dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/skill ./skill
COPY --from=builder /app/.kiro ./.kiro

# Expose ports
EXPOSE 3001

# Start the combined server
CMD ["npx", "tsx", "server/src/server.ts"]
