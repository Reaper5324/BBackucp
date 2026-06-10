FROM php:8.3-apache

RUN docker-php-ext-install pdo pdo_mysql

# Write MPM prefork config directly — bypass a2enmod/a2dismod entirely
RUN echo '<IfModule !mpm_prefork_module>\n\
    LoadModule mpm_prefork_module /usr/lib/apache2/modules/mod_mpm_prefork.so\n\
</IfModule>' > /etc/apache2/mods-available/mpm_prefork.load \
    && find /etc/apache2/mods-enabled -name 'mpm_*.load' -delete \
    && find /etc/apache2/mods-enabled -name 'mpm_*.conf' -delete \
    && ln -s /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load \
    && ln -s /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf

RUN a2enmod rewrite headers

WORKDIR /var/www/html

COPY bater/ ./bater/
COPY public/ ./public/

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' \
    /etc/apache2/sites-available/000-default.conf

RUN printf '<Directory /var/www/html/public>\n\tAllowOverride All\n\tRequire all granted\n</Directory>\n' \
    >> /etc/apache2/apache2.conf

RUN mkdir -p /var/www/html/public/uploads/products \
    && chown -R www-data:www-data /var/www/html/public/uploads \
    && chmod -R 775 /var/www/html/public/uploads

EXPOSE 80
