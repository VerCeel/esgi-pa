#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
  php artisan key:generate --force
fi

mkdir -p database storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
touch database/database.sqlite
chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true

exec "$@"
