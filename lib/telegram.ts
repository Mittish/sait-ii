import type { OrderRecord } from "@/lib/storage";

export async function sendTelegramMessage(order: OrderRecord) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const siteUrl = process.env.SITE_URL;

  if (!token || !chatId || !siteUrl) {
    console.warn("Telegram или SITE_URL не настроены. Уведомление пропущено.");
    return;
  }

  const text = [
    "Новый оплаченный заказ",
    "",
    `Заказ: ${order.id}`,
    `Статус: ${order.status}`,
    `Формат: ${order.videoTitle}`,
    `Имя ребёнка: ${order.childName}`,
    `Возраст: ${order.childAge}`,
    `Имя игрушки/питомца: ${order.companionName || "-"}`,
    "",
    "Пожелания:",
    order.wishes,
    "",
    `Фото ребёнка: ${siteUrl}${order.childPhotoUrl}`,
    `Фото игрушки/питомца: ${siteUrl}${order.companionPhotoUrl}`
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Ошибка Telegram: ${raw}`);
  }
}
