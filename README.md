# MagicKid Video

Готовый минимальный проект на Next.js:
- красивая главная страница
- форма создания видео
- счёт на оплату через ЮKassa
- backend для создания платежа
- webhook для подтверждения оплаты
- отправка оплаченного заказа в Telegram
- сохранение фото в `public/uploads`
- сохранение заказов в `data/orders`

## 1. Установка

Скопируй `.env.example` в `.env.local` и заполни своими значениями.

```bash
cp .env.example .env.local
npm install
npm run dev
```

После этого открой:

```text
http://localhost:3000
```

## 2. Что заполнить в `.env.local`

```env
YOOKASSA_SHOP_ID=твой_shop_id
YOOKASSA_SECRET_KEY=твой_secret_key
SITE_URL=https://твойдомен.ру

TELEGRAM_BOT_TOKEN=твой_бот_токен
TELEGRAM_CHAT_ID=твой_chat_id
```

Для локального теста можно временно поставить:

```env
SITE_URL=http://localhost:3000
```

## 3. Где лежат важные файлы

- `app/page.tsx` — сайт и форма
- `app/api/create-payment/route.ts` — создание заказа и платежа
- `app/api/yookassa-webhook/route.ts` — подтверждение оплаты и отправка тебе заказа
- `lib/storage.ts` — сохранение фото и заказов
- `lib/telegram.ts` — отправка заказа в Telegram
- `lib/yookassa.ts` — работа с API ЮKassa

## 4. Что нужно сделать в кабинете ЮKassa

Настрой webhook на адрес:

```text
https://твойдомен.ру/api/yookassa-webhook
```

События:
- `payment.succeeded`
- `payment.canceled`

## 5. Важно

Этот стартовый проект хранит фото и заказы на диске сервера.
Для первого запуска это нормально. Для серьёзного продакшена лучше потом перенести хранение в облачное хранилище и базу данных.
