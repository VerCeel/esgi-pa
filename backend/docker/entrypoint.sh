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

# La boucle ci-dessus ne couvre que les clés NON commentées de .env.example.
# DB_DATABASE y est commenté, mais le serveur (`artisan serve`) tourne dans un
# sous-processus qui ne lit que le .env : on l'y écrit donc explicitement.
if [ -n "$DB_DATABASE" ]; then
  if grep -q '^DB_DATABASE=' .env; then
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE}|" .env
  else
    printf '\nDB_DATABASE=%s\n' "$DB_DATABASE" >> .env
  fi
fi

if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Le fichier SQLite vit dans un sous-dossier dédié (monté en volume). Ne JAMAIS monter
# le volume sur database/ entier : il masquerait migrations/ et figerait le schéma.
DB_FILE="${DB_DATABASE:-database/database.sqlite}"
mkdir -p "$(dirname "$DB_FILE")" storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
touch "$DB_FILE"
chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true

exec "$@"
