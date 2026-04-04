export function getYookassaAuthHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error("Не заданы YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY");
  }

  const encoded = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}

export async function getPaymentById(paymentId: string) {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getYookassaAuthHeader()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.description || "Не удалось проверить платёж в ЮKassa");
  }

  return data;
}
