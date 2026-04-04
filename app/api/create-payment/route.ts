import crypto from "node:crypto";
import { ensureStorage, saveOrder, saveUploadedFile, loadOrder, type OrderRecord } from "@/lib/storage";
import { getYookassaAuthHeader } from "@/lib/yookassa";

export const runtime = "nodejs";

const amountFromForm = String(formData.get("amount") || "").trim();

export async function POST(request: Request) {
  try {
    await ensureStorage();

    const formData = await request.formData();

    const planId = String(formData.get("planId") || "").trim();
const planTitle = String(formData.get("planTitle") || "").trim();
const planDuration = String(formData.get("planDuration") || "").trim();
const childName = String(formData.get("childName") || "").trim();
const childAge = String(formData.get("childAge") || "").trim();
const companionName = String(formData.get("companionName") || "").trim();
const wishes = String(formData.get("wishes") || "").trim();

const childPhoto = formData.get("childPhoto");
const companionPhoto = formData.get("companionPhoto");

if (!planId || !planTitle || !planDuration || !childName || !childAge || !wishes) {
  return Response.json(
    { error: "Не заполнены обязательные поля формы." },
    { status: 400 }
  );
}

    if (!(childPhoto instanceof File)) {
      return Response.json({ error: "Фото ребёнка не загружено." }, { status: 400 });
    }

    if (!(companionPhoto instanceof File)) {
      return Response.json({ error: "Фото игрушки или питомца не загружено." }, { status: 400 });
    }

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      return Response.json({ error: "В .env.local не задан SITE_URL." }, { status: 500 });
    }

    const orderId = crypto.randomUUID();
    const childPhotoUrl = await saveUploadedFile(childPhoto, orderId, "child");
    const companionPhotoUrl = await saveUploadedFile(companionPhoto, orderId, "companion");

    const newOrder = {
  id: orderId,
  status: "pending_payment",
  amount: amountFromForm,
  currency: "RUB",
  planId,
  planTitle,
  planDuration,
  childName,
  childAge,
  companionName,
  wishes,
  childPhotoUrl,
  companionPhotoUrl,
  paymentId: null,
  createdAt: new Date().toISOString(),
  paidAt: null,
};

    await saveOrder(order);

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getYookassaAuthHeader(),
        "Idempotence-Key": crypto.randomUUID()
      },
      body: JSON.stringify({
        amount: {
          value: PRICE_RUB,
          currency: "RUB"
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: `${siteUrl}?paymentStatus=success&orderId=${orderId}`
        },
        description: `${planTitle} — заказ ${orderId}`,
        metadata: {
          order_id: orderId
        }
      })
    });

    const payment = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: payment?.description || "ЮKassa не создала платёж." },
        { status: 400 }
      );
    }

    const storedOrder = await loadOrder(orderId);
    storedOrder.paymentId = payment?.id || null;
    storedOrder.yookassaStatus = payment?.status || null;
    await saveOrder(storedOrder);

    return Response.json({
      orderId,
      confirmationUrl: payment?.confirmation?.confirmation_url || null
    });
  } catch (error) {
    console.error("create-payment error:", error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Внутренняя ошибка сервера"
      },
      { status: 500 }
    );
  }
}
