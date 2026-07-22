import type { Locale } from "@/types/shop";

const errorCopy = {
  en: {
    stock: "One or more items are no longer available in the requested quantity. Please review your cart.",
    activeOrders: "You already have several active orders. Please complete or cancel an existing order first.",
    emptyCart: "Your cart is empty.",
    tooManyItems: "Your cart has too many different items. Please reduce it to 50 products or fewer.",
    duplicateItem: "The cart contains a duplicate product. Please refresh the page and try again.",
    invalidQuantity: "Please check the quantity of each item in your cart.",
    unsupportedCountry: "Shipping is not available for the selected country yet.",
    delivery: "Please check your name, phone number, address, city, and postal code.",
    paymentNotReady: "This order is not ready for payment yet.",
    cannotCancel: "This order can no longer be cancelled online. Please contact the store.",
    cannotEdit: "This delivery address can no longer be edited online. Please contact the store.",
    quoteExpired: "This shipping quote has expired. Please contact the store for a new quote.",
    signIn: "Please sign in with Google before checkout.",
    orderNotFound: "Order not found. Please refresh the page and try again.",
    orderNotCreated: "The order could not be created. Please try again.",
    proofMissing: "The receipt image was not uploaded successfully. Please choose the image and try again.",
    connection: "The connection was interrupted. Please check your internet connection and try again.",
    fallback: "We could not complete that action. Please try again or contact the store.",
  },
  th: {
    stock: "สินค้าบางรายการมีจำนวนไม่เพียงพอหรือไม่พร้อมขายแล้ว กรุณาตรวจสอบตะกร้าอีกครั้ง",
    activeOrders: "คุณมีคำสั่งซื้อที่กำลังดำเนินการหลายรายการ กรุณาชำระหรือยกเลิกรายการเดิมก่อน",
    emptyCart: "ไม่มีสินค้าในตะกร้า",
    tooManyItems: "ตะกร้ามีสินค้าหลายรายการเกินไป กรุณาลดให้เหลือไม่เกิน 50 รายการ",
    duplicateItem: "พบสินค้าซ้ำในตะกร้า กรุณารีเฟรชหน้าแล้วลองอีกครั้ง",
    invalidQuantity: "กรุณาตรวจสอบจำนวนสินค้าทุกรายการในตะกร้า",
    unsupportedCountry: "ขณะนี้ยังไม่รองรับการจัดส่งไปยังประเทศที่เลือก",
    delivery: "กรุณาตรวจสอบชื่อ เบอร์โทร ที่อยู่ เมือง และรหัสไปรษณีย์ให้ครบถ้วน",
    paymentNotReady: "คำสั่งซื้อนี้ยังไม่พร้อมรับหลักฐานการชำระเงิน",
    cannotCancel: "ไม่สามารถยกเลิกคำสั่งซื้อนี้ทางเว็บไซต์ได้แล้ว กรุณาติดต่อร้านค้า",
    cannotEdit: "ไม่สามารถแก้ไขที่อยู่จัดส่งนี้ทางเว็บไซต์ได้แล้ว กรุณาติดต่อร้านค้า",
    quoteExpired: "ใบเสนอค่าจัดส่งหมดอายุแล้ว กรุณาติดต่อร้านค้าเพื่อขอราคาใหม่",
    signIn: "กรุณาเข้าสู่ระบบด้วย Google ก่อนชำระเงิน",
    orderNotFound: "ไม่พบคำสั่งซื้อ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง",
    orderNotCreated: "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองอีกครั้ง",
    proofMissing: "อัปโหลดรูปใบเสร็จไม่สำเร็จ กรุณาเลือกรูปแล้วลองอีกครั้ง",
    connection: "การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง",
    fallback: "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้งหรือติดต่อร้านค้า",
  },
} as const;

export function customerErrorMessage(error: unknown, locale: Locale = "en"): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  const normalized = message.toLowerCase();
  const copy = errorCopy[locale];
  if (normalized.includes("insufficient stock") || normalized.includes("product unavailable")) return copy.stock;
  if (normalized.includes("too many active orders")) return copy.activeOrders;
  if (normalized.includes("cart is empty")) return copy.emptyCart;
  if (normalized.includes("too many cart items")) return copy.tooManyItems;
  if (normalized.includes("duplicate product")) return copy.duplicateItem;
  if (normalized.includes("invalid quantity")) return copy.invalidQuantity;
  if (normalized.includes("unsupported country")) return copy.unsupportedCountry;
  if (normalized.includes("delivery fields") || normalized.includes("shipping details") || normalized.includes("customer or shipping details")) return copy.delivery;
  if (normalized.includes("not ready for payment")) return copy.paymentNotReady;
  if (normalized.includes("can no longer be cancelled")) return copy.cannotCancel;
  if (normalized.includes("can no longer be edited")) return copy.cannotEdit;
  if (normalized.includes("shipping quote") && (normalized.includes("expired") || normalized.includes("unavailable"))) return copy.quoteExpired;
  if (normalized.includes("sign in") || normalized.includes("authentication required")) return copy.signIn;
  if (normalized.includes("order not found")) return copy.orderNotFound;
  if (normalized.includes("order was not created")) return copy.orderNotCreated;
  if (normalized.includes("payment proof was not uploaded") || normalized.includes("invalid storage path")) return copy.proofMissing;
  if (normalized.includes("fetch") || normalized.includes("network")) return copy.connection;
  return copy.fallback;
}
