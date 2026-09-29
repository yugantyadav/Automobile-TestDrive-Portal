# ATDP — Automobile Test Drive Portal
# Multi-purpose image: API (port 5000) + static frontend served by Express

FROM node:20-bookworm-slim

# Native build deps for better-sqlite3
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer caching)
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# App source
COPY backend ./backend
COPY frontend ./frontend
COPY database ./database

# SQLite lives here (mount a volume to persist)
ENV DB_PATH=/data/database.sqlite
RUN mkdir -p /data

ENV NODE_ENV=production
EXPOSE 5000

# Seed demo data on first run only, then start server
CMD ["sh", "-c", "if [ ! -s \"$DB_PATH\" ]; then node backend/seed.js; fi; exec node backend/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
