FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf.template
COPY env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

COPY dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
