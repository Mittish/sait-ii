import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type OrderRecord = {
  id: string;
  status: "pending_payment" | "paid" | "canceled";
  amount: string;
  currency: string;
  videoKind: string;
  videoTitle: string;
  childName: string;
  childAge: string;
  companionName: string;
  wishes: string;
  childPhotoUrl: string;
  companionPhotoUrl: string;
  paymentId: string | null;
  yookassaStatus?: string | null;
  amountPaid?: string | null;
  createdAt: string;
  paidAt: string | null;
  canceledAt?: string | null;
};

const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");
const ORDERS_DIR = path.join(ROOT_DIR, "data", "orders");

export async function ensureStorage() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(ORDERS_DIR, { recursive: true });
}

function getExtension(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return ext;
  }
  return ".jpg";
}

export async function saveUploadedFile(file: File, orderId: string, prefix: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${orderId}-${prefix}-${Date.now()}${getExtension(file.name)}`;
  const absolutePath = path.join(UPLOADS_DIR, fileName);

  await writeFile(absolutePath, buffer);

  return `/uploads/${fileName}`;
}

function getOrderFilePath(orderId: string) {
  return path.join(ORDERS_DIR, `${orderId}.json`);
}

export async function saveOrder(order: OrderRecord) {
  await writeFile(getOrderFilePath(order.id), JSON.stringify(order, null, 2), "utf-8");
}

export async function loadOrder(orderId: string): Promise<OrderRecord> {
  const raw = await readFile(getOrderFilePath(orderId), "utf-8");
  return JSON.parse(raw) as OrderRecord;
}
