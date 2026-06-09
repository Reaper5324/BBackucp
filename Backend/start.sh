#!/bin/sh

echo "=== ENV ==="
echo "PORT=$PORT"

APP_PORT=${PORT:-80}

echo "=== CURRENT NGINX DEFAULT CONFIG ==="
cat /etc/nginx/sites-available/default 2>/dev/null || echo "sites-available/default NOT FOUND"
cat /etc/nginx/conf.d/default.conf 2>/dev/null || echo "conf.d/default.conf NOT FOUND"

echo "=== PATCH NGINX PORT to $APP_PORT ==="
sed -i "s/listen 80;/listen $APP_PORT;/g" /etc/nginx/sites-available/default 2>/dev/null
sed -i "s/listen 80;/listen $APP_PORT;/g" /etc/nginx/conf.d/default.conf 2>/dev/null

echo "=== AFTER PATCH ==="
cat /etc/nginx/sites-available/default 2>/dev/null
cat /etc/nginx/conf.d/default.conf 2>/dev/null

echo "=== START PHP-FPM ==="
php-fpm -D
sleep 2

echo "=== LISTENING SOCKETS ==="
ss -tulpn

echo "=== NGINX BINARY ==="
which nginx
nginx -V 2>&1

echo "=== FIX LOG PERMISSIONS ==="
mkdir -p /var/log/nginx
touch /var/log/nginx/error.log /var/log/nginx/access.log
chmod 777 /var/log/nginx/error.log /var/log/nginx/access.log

echo "=== START NGINX ==="
nginx -e /dev/stderr -g "daemon off;" 2>&1
echo "=== NGINX EXIT CODE: $? ==="
