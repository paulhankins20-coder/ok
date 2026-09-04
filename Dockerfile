# Multi-stage Dockerfile for plain container deployment
# Stage 1: Build the client assets and server bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend and bundle Express server into dist/server.cjs
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and bundled server from builder stage
COPY --from=builder /app/dist ./dist

# Plain Docker container runs on port 3000
EXPOSE 3000

# Start compiled server
CMD ["node", "dist/server.cjs"]
