import type { OrderStatus } from "@/types/shop";

export const adminOrderStatusCopy: Record<OrderStatus, string> = {
  shipping_quote: "รอแจ้งค่าจัดส่ง",
  waiting_payment: "รอชำระเงิน",
  payment_submitted: "รอตรวจสอบสลิป",
  paid: "ชำระเงินแล้ว",
  preparing: "กำลังเตรียมสินค้า",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิกแล้ว",
};
