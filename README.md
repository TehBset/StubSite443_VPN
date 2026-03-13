# StubSite443_VPN

Статическая заглушка `Word -> PDF`, которая поднимается на `https://mutabor-sec.ru:443` через обычный `nginx` и использует сертификаты Let's Encrypt из `/etc/letsencrypt/live/mutabor-sec.ru/`.

## Структура

- `index.html`, `styles.css`, `script.js` - сам сайт
- `nginx/stubsite443_vpn.conf` - готовый конфиг для `nginx`
- `deploy.sh` - быстрый деплой на сервере

## Куда класть на сервере

Репозиторий рассчитан на размещение по пути:

```bash
/home/hosty/StubSite443_VPN
```

## Быстрый запуск

Создать каталог и положить туда репозиторий:

```bash
mkdir -p /home/hosty/StubSite443_VPN
```

Запустить деплой:

```bash
cd /home/hosty/StubSite443_VPN
chmod +x deploy.sh
./deploy.sh
```

Проверка:

```bash
curl -kI https://127.0.0.1
curl -kI https://mutabor-sec.ru
```

## Что важно на сервере

- `nginx` должен иметь доступ на чтение к `/home/hosty/StubSite443_VPN`
- в вашей сборке `nginx` должны использоваться `sites-available` и `sites-enabled`
- сертификаты должны существовать по путям ниже
- у пользователя, который запускает `deploy.sh`, должен быть `sudo` для `apt-get`, `cp`, `ln`, `nginx -t` и `systemctl`
- `deploy.sh` сам настраивает доступ `www-data` к каталогу сайта через `setfacl`, а если `setfacl` нет, использует `chmod` для прохода по `/home` и `/home/hosty`

Используемые пути:

```text
/etc/letsencrypt/live/mutabor-sec.ru/fullchain.pem
/etc/letsencrypt/live/mutabor-sec.ru/privkey.pem
```

## Если 443 уже занят

Посмотреть, кто слушает порт:

```bash
sudo ss -tulpn | grep :443
```

После освобождения порта повторно запустить:

```bash
./deploy.sh
```
