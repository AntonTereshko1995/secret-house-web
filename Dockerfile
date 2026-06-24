# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Remove images before build so vite does not copy 628MB into dist/ (images go directly to nginx).
# Also clean prerender temp files that vite-prerender-plugin writes to node_modules but never removes.
RUN rm -rf public/images && npm run build && rm -rf node_modules

# Stage 2: Production
FROM nginx:alpine

# Copy nginx config as template (API_PROXY_URL substituted at runtime via env-config.sh)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Runtime env injection script
COPY env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

# Copy compiled JS/CSS/HTML from builder stage (images are served from /data at runtime)
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
