#!/bin/sh

echo "=== ENV ==="
echo "PORT=$PORT"

APP_PORT=${PORT:-80}

echo "=== PATCH NGINX PORT to $APP_PORT ==="
sed -i "s/listen 80;/listen $APP_PORT;/g" /etc/nginx/sites-available/default 2>/dev/null

echo "=== START PHP-FPM ==="
php-fpm -D
sleep 2

echo "=== FIX NGINX RUNTIME DIRS ==="
mkdir -p /var/lib/nginx/body \
         /var/lib/nginx/fastcgi \
         /var/lib/nginx/proxy \
         /var/lib/nginx/scgi \
         /var/lib/nginx/uwsgi \
         /var/log/nginx \
         /run
chmod -R 777 /var/lib/nginx /var/log/nginx /run
touch /run/nginx.pid
chmod 777 /run/nginx.pid

echo "=== START NGINX ==="
nginx -e /dev/stderr -g "daemon off;" 2>&1
echo "=== NGINX EXIT CODE: $? ==="
