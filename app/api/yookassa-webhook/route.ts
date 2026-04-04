import { ensureStorage, loadOrder, saveOrder } from "@/lib/storage";
import { sendTelegramMessage } from "@/lib/telegram";
import { getPaymentById } from "@/lib/yookassa";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureStorage();
    const body = await request.json().catch(() => null);

    if (!body?.event || !body?.object?.id) {
      return new Response("ok", { status: 200 });
    }

    const event = body.event as string;
    const paymentId = body.object.id as string;

    if (event === "payment.canceled") {
      const canceledOrderId = body?.object?.metadata?.order_id as string | undefined;
      if (canceledOrderId) {
        try {
          const order = await loadOrder(canceledOrderId);
          order.status = "canceled";
          order.canceledAt = new Date().toISOString();
          await saveOrder(order);
        } catch (error) {
          console.warn("Не удалось обновить canceled заказ:", error);
        }
      }
      return new Response("ok", { status: 200 });
    }

    if (event !== "payment.succeeded") {
      return new Response("ok", { status: 200 });
    }

    const payment = await getPaymentById(paymentId);

    if (payment?.status !== "succeeded" || payment?.paid !== true) {
      return new Response("ok", { status: 200 });
    }

    const orderId = payment?.metadata?.order_id as string | undefined;
    if (!orderId) {
      console.warn("В платеже нет metadata.order_id");
      return new Response("ok", { status: 200 });
    }

    let order;
    try {
      order = await loadOrder(orderId);
    } catch (error) {
      console.warn("Заказ не найден:", orderId, error);
      return new Response("ok", { status: 200 });
    }

    if (order.status === "paid") {
      return new Response("ok", { status: 200 });
    }

    order.status = "paid";
    order.paidAt = new Date().toISOString();
    order.paymentId = payment.id;
    order.yookassaStatus = payment.status;
    order.amountPaid = payment?.amount?.value || null;

    await saveOrder(order);
    await sendTelegramMessage(order);

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("yookassa-webhook error:", error);
    return new Response("error", { status: 500 });
  }
}
