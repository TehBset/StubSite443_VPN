#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/home/hosty/StubSite443_VPN"
NGINX_AVAILABLE="/etc/nginx/sites-available/stubsite443_vpn.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/stubsite443_vpn.conf"
SOURCE_NGINX_CONF="$APP_DIR/nginx/stubsite443_vpn.conf"
CERT_DIR="/etc/letsencrypt/live/mutabor-sec.ru"

log() {
  printf '[deploy] %s\n' "$1"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "Файл не найден: $path"
}

install_nginx_if_missing() {
  if command -v nginx >/dev/null 2>&1; then
    return
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    fail "nginx не установлен, а apt-get не найден. Установи nginx вручную."
  fi

  log "nginx не найден, устанавливаю через apt"
  sudo apt-get update
  sudo apt-get install -y nginx
}

grant_nginx_access() {
  log "Настраиваю доступ nginx к каталогу сайта"

  if command -v setfacl >/dev/null 2>&1; then
    sudo setfacl -m u:www-data:x /home
    sudo setfacl -m u:www-data:x /home/hosty
    sudo setfacl -m u:www-data:rx "$APP_DIR"
    sudo setfacl -m u:www-data:rx "$APP_DIR/nginx"
    sudo setfacl -m u:www-data:r "$APP_DIR/index.html"
    sudo setfacl -m u:www-data:r "$APP_DIR/styles.css"
    sudo setfacl -m u:www-data:r "$APP_DIR/script.js"
    sudo setfacl -m u:www-data:r "$SOURCE_NGINX_CONF"
    return
  fi

  log "setfacl не найден, использую chmod для прохода по каталогам"
  sudo chmod o+x /home
  sudo chmod o+x /home/hosty
}

if [[ ! -d "$APP_DIR" ]]; then
  fail "Каталог приложения не найден: $APP_DIR"
fi

require_file "$APP_DIR/index.html"
require_file "$APP_DIR/styles.css"
require_file "$APP_DIR/script.js"
require_file "$SOURCE_NGINX_CONF"
require_file "$CERT_DIR/fullchain.pem"
require_file "$CERT_DIR/privkey.pem"

command -v systemctl >/dev/null 2>&1 || fail "systemctl не найден"

install_nginx_if_missing

log "Проверяю права на чтение статических файлов"
chmod 755 "$APP_DIR"
chmod 755 "$APP_DIR/nginx"
chmod 644 "$APP_DIR/index.html" "$APP_DIR/styles.css" "$APP_DIR/script.js" "$SOURCE_NGINX_CONF"
grant_nginx_access

log "Устанавливаю конфиг nginx"
sudo cp "$SOURCE_NGINX_CONF" "$NGINX_AVAILABLE"
sudo ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"

log "Проверяю конфигурацию nginx"
sudo nginx -t

log "Включаю и перезапускаю nginx"
sudo systemctl enable nginx
sudo systemctl restart nginx

log "Проверяю ответ по HTTPS на localhost"
curl -kI --max-time 10 https://127.0.0.1 >/dev/null

log "Сайт развернут: https://mutabor-sec.ru"
