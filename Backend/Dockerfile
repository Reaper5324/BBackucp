FROM php:8.3-fpm

# Install nginx and PHP extensions
RUN apt-get update && apt-get install -y nginx netcat-openbsd \
    && docker-php-ext-install pdo pdo_mysql \
    && rm -rf /var/lib/apt/lists/*


# Copy nginx config
COPY nginx.conf /etc/nginx/sites-available/default

# Set working directory
WORKDIR /var/www/html

# Copy backend source
COPY bater/ ./bater/
COPY public/ ./public/

# Fix permissions for uploads
RUN mkdir -p /var/www/html/public/uploads/products \
    && chown -R www-data:www-data /var/www/html/public/uploads \
    && chmod -R 775 /var/www/html/public/uploads

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
