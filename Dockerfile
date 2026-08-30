# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# vite-prerender-plugin leaves open handles in Node.js so the process never
# exits. We run with a timeout, then verify the actual build output exists.
RUN timeout 120 npm run build; ls /app/dist/index.html

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
COPY --from=builder /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
