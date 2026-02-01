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

# Build arguments for environment variables
ARG VITE_LOCATION_LAT=53.934202
ARG VITE_LOCATION_LON=27.300385
ARG VITE_LOCATION_ADDRESS="Минск, Беларусь"
ARG VITE_BOT_USERNAME=the_secret_house_booking_bot
ARG VITE_TELEGRAM_ADMIN=the_secret_house
ARG VITE_TELEGRAM_CHANNEL=sekret_blr
ARG VITE_INSTAGRAM_USERNAME=private_sekret_blr
ARG VITE_PHONE_NUMBER=+375257908378

# Convert ARG to ENV for the build process
ENV VITE_LOCATION_LAT=$VITE_LOCATION_LAT
ENV VITE_LOCATION_LON=$VITE_LOCATION_LON
ENV VITE_LOCATION_ADDRESS=$VITE_LOCATION_ADDRESS
ENV VITE_BOT_USERNAME=$VITE_BOT_USERNAME
ENV VITE_TELEGRAM_ADMIN=$VITE_TELEGRAM_ADMIN
ENV VITE_TELEGRAM_CHANNEL=$VITE_TELEGRAM_CHANNEL
ENV VITE_INSTAGRAM_USERNAME=$VITE_INSTAGRAM_USERNAME
ENV VITE_PHONE_NUMBER=$VITE_PHONE_NUMBER

# Build the application with environment variables
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install base64 utility (already in alpine)
# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Expose ports 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Use custom entrypoint to setup SSL certificates from env vars
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
