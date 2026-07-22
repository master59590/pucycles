import type { CountryCode, CurrencyCode, OrderStatus } from "@/types/shop";

export const countries: Array<{
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  rate: number;
}> = [
  { code: "TH", name: "Thailand", currency: "THB", rate: 1 },
  { code: "AT", name: "Austria", currency: "EUR", rate: 0.026 },
  { code: "AU", name: "Australia", currency: "AUD", rate: 0.043 },
  { code: "PH", name: "Philippines", currency: "PHP", rate: 1.66 },
  { code: "AE", name: "UAE / Dubai", currency: "AED", rate: 0.108 },
  { code: "IN", name: "India", currency: "INR", rate: 2.47 },
];

export const orderStatusCopy: Record<OrderStatus, { en: string; th: string }> = {
  shipping_quote: { en: "Waiting shipping quote", th: "รอตรวจสอบค่าจัดส่ง" },
  waiting_payment: { en: "Waiting payment", th: "รอชำระเงิน" },
  payment_submitted: { en: "Payment submitted", th: "รอตรวจสอบหลักฐาน" },
  paid: { en: "Paid", th: "ชำระเงินแล้ว" },
  preparing: { en: "Preparing", th: "กำลังจัดเตรียม" },
  shipped: { en: "Shipped", th: "จัดส่งแล้ว" },
  cancelled: { en: "Cancelled", th: "ยกเลิก" },
  refund_pending: { en: "Refund in progress", th: "กำลังคืนเงิน" },
  refunded: { en: "Refunded", th: "คืนเงินแล้ว" },
};

export function getCountry(code: CountryCode) {
  return countries.find((country) => country.code === code) ?? countries[0];
}

export function formatMoney(priceThb: number, countryCode: CountryCode, locale: "en" | "th") {
  const country = getCountry(countryCode);
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: country.currency === "THB" ? 0 : 2,
  }).format(priceThb * country.rate);
}
