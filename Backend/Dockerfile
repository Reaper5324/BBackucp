
FROM php:8.3-apache
 
# Fix MPM conflict — disable event, enable prefork (required for PHP)
RUN a2dismod mpm_event && a2enmod mpm_prefork
 
# Enable Apache modules
RUN a2enmod rewrite headers
 
# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql
 
# Set working directory
WORKDIR /var/www/html
 
# Copy backend source
COPY bater/ ./bater/
COPY public/ ./public/
 
# Set public/ as the Apache document root
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' \
    /etc/apache2/sites-available/000-default.conf
 
# Allow .htaccess overrides
RUN echo '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf
 
# Fix permissions for uploads
RUN mkdir -p /var/www/html/public/uploads/products \
    && chown -R www-data:www-data /var/www/html/public/uploads \
    && chmod -R 775 /var/www/html/public/uploads
 
EXPOSE 80
