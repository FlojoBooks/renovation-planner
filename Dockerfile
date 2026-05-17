# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Kopieer package-bestanden eerst → optimale laagcaching
COPY package.json package-lock.json ./

# Installeer alle dependencies (devDeps nodig voor Vite/tsc build)
RUN npm ci

# Kopieer broncode en bouw de app
COPY . .
RUN npm run build

# ── Stage 2: Production – nginx (gepinde versie voor reproducibility) ─────────
FROM nginx:1.27-alpine AS production

# Verwijder de default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Kopieer onze volledige nginx-configuratie
COPY nginx.conf /etc/nginx/nginx.conf

# Kopieer de gebouwde static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Maak non-root gebruiker aan en pas eigenaarschap aan
RUN addgroup -g 1001 -S appgroup \
    && adduser -u 1001 -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

# Health check – Railway en Docker kunnen hiermee de container monitoren
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
