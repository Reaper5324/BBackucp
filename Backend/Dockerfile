# PHP-FPM backend. FPM listens on port 9000 and does not serve HTTP directly.
# Nginx (see nginx.conf) must be deployed as a separate service or sidecar and
# configured to fastcgi_pass to this container on port 9000. The Nginx service
# also needs access to /var/www/html/public for static files.
FROM php:8.3-fpm

RUN docker-php-ext-install pdo pdo_mysql

RUN php -v && php -m | grep -i pdo

WORKDIR /var/www/html

COPY bater/ ./bater/
COPY public/ ./public/

RUN mkdir -p /var/www/html/public/uploads/products \
    && chown -R www-data:www-data /var/www/html/public/uploads \
    && chmod -R 775 /var/www/html/public/uploads \
    && chown www-data:www-data /var/www/html/public \
    && chmod 775 /var/www/html/public

EXPOSE 9000
