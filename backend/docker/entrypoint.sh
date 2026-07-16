#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ -n "$APP_KEY" ]; then
  # Propager la clé fournie par l'environnement dans le .env, sinon Laravel
  # peut lire la valeur vide héritée de .env.example.
  sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
else
  php artisan key:generate --force
fi

mkdir -p database storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
touch database/database.sqlite
chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true

exec "$@"
