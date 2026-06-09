#!/bin/sh

echo "=== ENV ==="
echo "PORT=$PORT"

# Use Railway's PORT or default to 80
APP_PORT=${PORT:-80}

echo "=== PATCH NGINX PORT ==="
sed -i "s/listen 80;/listen $APP_PORT;/" /etc/nginx/sites-available/default

echo "=== NGINX CONFIG TEST ==="
nginx -t || exit 1

echo "=== START PHP-FPM ==="
php-fpm -D

sleep 2

echo "=== LISTENING SOCKETS ==="
ss -tulpn

echo "=== START NGINX ==="
nginx -g "daemon off;"