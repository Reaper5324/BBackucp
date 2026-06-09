#!/bin/sh

# Test nginx config first
nginx -t

# Start PHP-FPM in background
php-fpm &

# Start nginx in foreground
nginx -g "daemon off;"
