import path from "path";
import crypto from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";

export const runtime = "nodejs";

const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");
const ORDERS_DIR = path.join(ROOT_DIR, "data", "orders");

async function ensureDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(ORDERS_DIR, { recursive: true });
}

function getFileExtension(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
    return ext;
  }
  return ".jpg";
}

async function saveUploadedFile(file: File, orderId: string, prefix: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = getFileExtension(file.name);
  const fileName = `${orderId}-${prefix}-${Date.now()}${ext}`;
  const absolutePath = path.join(UPLOADS_DIR, fileName);

  await writeFile(absolutePath, buffer);

  return `/uploads/${fileName}`;
}

function orderFilePath(orderId: string) {
  return path.join(ORDERS_DIR, `${orderId}.json`);
}

async function saveOrder(order: Record<string, unknown>) {
  await writeFile(orderFilePath(String(order.id)), JSON.stringify(order, null, 2), "utf-8");
}

async function loadOrder(orderId: string) {
  const file = await readFile(orderFilePath(orderId), "utf-8");
  return JSON.parse(file) as Record<string, unknown>;
}

function getAuthHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error("Не заданы YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY");
  }

  const encoded = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}

export async function POST(request: Request) {
  try {
    await ensureDirs();

    const formData = await request.formData();

    const planId = String(formData.get("planId") || "").trim();
    const planTitle = String(formData.get("planTitle") || "").trim();
    const planDuration = String(formData.get("planDuration") || "").trim();
    const childName = String(formData.get("childName") || "").trim();
    const childAge = String(formData.get("childAge") || "").trim();
    const companionName = String(formData.get("companionName") || "").trim();
    const wishes = String(formData.get("wishes") || "").trim();
    const amountFromForm = String(formData.get("amount") || "").trim();

    const childPhoto = formData.get("childPhoto");
    const companionPhoto = formData.get("companionPhoto");

    if (!planId || !planTitle || !planDuration || !childName || !childAge || !wishes) {
      return Response.json(
        { error: "Не заполнены обязательные поля формы." },
        { status: 400 }
      );
    }

    if (!amountFromForm) {
      return Response.json(
        { error: "Не передана сумма тарифа." },
        { status: 400 }
      );
    }

    if (!(childPhoto instanceof File)) {
      return Response.json(
        { error: "Фото ребёнка не загружено." },
        { status: 400 }
      );
    }

    if (!(companionPhoto instanceof File)) {
      return Response.json(
        { error: "Фото игрушки или питомца не загружено." },
        { status: 400 }
      );
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

    await saveOrder(newOrder);

    const idempotenceKey = crypto.randomUUID();

    const yookassaPayload = {
      amount: {
        value: amountFromForm,
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${process.env.SITE_URL}?paymentStatus=success&orderId=${orderId}`,
      },
      description: `${planTitle} — заказ ${orderId}`,
      metadata: {
        order_id: orderId,
      },
    };

    const yookassaResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(yookassaPayload),
    });

    const payment = await yookassaResponse.json();

    if (!yookassaResponse.ok) {
      return Response.json(
        { error: payment?.description || "ЮKassa не создала платёж." },
        { status: 400 }
      );
    }

    const order = await loadOrder(orderId);
    order.paymentId = payment.id || null;
    order.yookassaStatus = payment.status || null;
    await saveOrder(order);

    return Response.json({
      orderId,
      confirmationUrl: payment?.confirmation?.confirmation_url || null,
    });
  } catch (error) {
    console.error("create-payment error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Внутренняя ошибка сервера",
      },
      { status: 500 }
    );
  }
}