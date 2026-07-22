export type ShippingCarrier = {
  id: number;
  name: string;
  trackingUrlTemplate: string;
  isActive: boolean;
};

export type StockMovement = {
  id: number;
  productId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityDelta: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export function getTrackingUrl(template: string, trackingNumber: string) {
  if (!template.trim() || !trackingNumber.trim()) return "";
  const encoded = encodeURIComponent(trackingNumber.trim());
  return template.includes("{tracking}") ? template.replaceAll("{tracking}", encoded) : template;
}
