#!/bin/sh

echo "=== ENV ==="
echo "PORT=$PORT"

APP_PORT=${PORT:-80}
echo "=== PATCH NGINX PORT to $APP_PORT ==="
sed -i "s/listen 80;/listen $APP_PORT;/g" /etc/nginx/sites-available/default
sed -i "s/listen 80;/listen $APP_PORT;/g" /etc/nginx/conf.d/default.conf 2>/dev/null || true

echo "=== NGINX CONFIG TEST ==="
nginx -t 2>&1 || exit 1

echo "=== START PHP-FPM ==="
php-fpm -D

sleep 2

echo "=== LISTENING SOCKETS ==="
ss -tulpn

echo "=== START NGINX ==="
nginx -g "daemon off;" 2>&1
