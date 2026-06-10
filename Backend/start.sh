#!/sh
# Dynamic port binding for Railway
sed -i "s/Listen 80/Listen ${PORT:-80}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT:-80}>/" /etc/apache2/sites-available/000-default.conf

# Force-disable extra MPM modules that Railway injects at runtime
a2dismod mpm_event 2>/dev/null || true
a2dismod mpm_worker 2>/dev/null || true

# Explicitly ensure only prefork is active
a2enmod mpm_prefork

# Hand execution off to the default Apache foreground process
exec apache2-foreground
