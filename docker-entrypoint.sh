#!/bin/sh
set -e

# Decode SSL certificate from environment variable
if [ -n "$SSL_CERTIFICATE_BASE64" ]; then
    echo "Setting up SSL certificate from environment variable..."
    echo "$SSL_CERTIFICATE_BASE64" | base64 -d > /etc/nginx/ssl/certificate.pem
    chmod 644 /etc/nginx/ssl/certificate.pem
    echo "SSL certificate configured"
else
    echo "WARNING: SSL_CERTIFICATE_BASE64 environment variable not set"
fi

# Decode SSL private key from environment variable
if [ -n "$SSL_PRIVATE_KEY_BASE64" ]; then
    echo "Setting up SSL private key from environment variable..."
    echo "$SSL_PRIVATE_KEY_BASE64" | base64 -d > /etc/nginx/ssl/private.key
    chmod 600 /etc/nginx/ssl/private.key
    echo "SSL private key configured"
else
    echo "WARNING: SSL_PRIVATE_KEY_BASE64 environment variable not set"
fi

# Execute the main command
exec "$@"
