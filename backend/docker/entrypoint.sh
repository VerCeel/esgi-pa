#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Toute variable fournie au conteneur (docker compose "environment:") prime sur
# le .env : on réécrit les lignes correspondantes, sinon les valeurs héritées de
# .env.example (vides ou pointant vers localhost) masquent la vraie config.
while IFS='=' read -r key _; do
  case "$key" in ''|\#*) continue ;; esac
  value="$(printenv "$key" || true)"
  if [ -n "$value" ]; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  fi
done < .env.example

if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

mkdir -p database storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
touch database/database.sqlite
chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true

exec "$@"
