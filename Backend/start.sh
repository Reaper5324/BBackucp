#!/bin/sh

echo "Testing nginx config..."
nginx -t || exit 1

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx..."
nginx -g "daemon off;"