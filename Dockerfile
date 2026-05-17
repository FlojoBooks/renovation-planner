# ── Stage 1: Frontend build ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
# Output: /app/frontend/dist

# ── Stage 2: Backend build ────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY backend/ .
RUN npm run build
# Output: /app/backend/dist

# ── Stage 3: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Kopieer backend runtime (alleen prod deps)
COPY backend/package*.json ./
RUN npm ci --omit=dev
RUN npx prisma generate

# Kopieer gecompileerde backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Kopieer frontend build → Express serveert dit als static files
COPY --from=frontend-builder /app/frontend/dist ./public

# Non-root gebruiker
RUN addgroup -g 1001 -S appgroup \
    && adduser -u 1001 -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Voer migraties uit en start de server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
