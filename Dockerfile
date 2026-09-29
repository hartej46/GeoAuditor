# ==========================================
# GEO Auditor — Production Multi-Stage Dockerfile
# Stage 1: Build React Vite Frontend
# Stage 2: Express Node.js Server Runner
# ==========================================

# --- Stage 1: Client Build ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server/ ./server
COPY demo/ ./demo
COPY index.js ./index.js

# Copy built static frontend assets into server production route
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/index.js"]
