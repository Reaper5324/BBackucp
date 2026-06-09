#!/bin/sh

echo "=== ENV ==="
echo "PORT=$PORT"

echo "=== NGINX CONFIG TEST ==="
nginx -t || exit 1

echo "=== START PHP-FPM ==="
php-fpm -D

sleep 2

echo "=== LISTENING SOCKETS ==="
ss -tulpn

echo "=== START NGINX ==="
nginx -g "daemon off;"