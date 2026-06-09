#!/bin/sh

# Ensure php-fpm socket directory exists
mkdir -p /var/run/php

# Test nginx config
nginx -t

# Start PHP-FPM in background
php-fpm &

# Wait for php-fpm socket to be ready
sleep 1

# Start nginx in foreground
nginx -g "daemon off;"
