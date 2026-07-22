export type Locale = "en" | "th";
export type CountryCode = "TH" | "AT" | "AU" | "PH" | "AE" | "IN";
export type CurrencyCode = "THB" | "EUR" | "AUD" | "PHP" | "AED" | "INR";

export type ShopPreferences = {
  locale: Locale;
  countryCode: CountryCode;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type OrderStatus =
  | "shipping_quote"
  | "waiting_payment"
  | "payment_submitted"
  | "paid"
  | "preparing"
  | "shipped"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export type PaymentInstructions = {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  receiver_name?: string;
  receiver_address?: string;
  country?: string;
  city?: string;
  phone?: string;
  instructions?: string;
};

export type CheckoutAddress = {
  name: string;
  phone: string;
  address: string;
  city: string;
  countryCode: CountryCode;
  postalCode: string;
};

export type CustomerOrderLine = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceThb: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  address: CheckoutAddress;
  currency: CurrencyCode;
  exchangeRate: number;
  lines: CustomerOrderLine[];
  subtotalThb: number;
  shippingFeeThb: number | null;
  paymentMethod: "bank_transfer" | "western_union";
  paymentInstructions: PaymentInstructions;
  paymentProofName?: string;
  paymentProofStatus?: "pending" | "approved" | "rejected";
  paymentRejectionReason?: string;
  shippingCompany?: string;
  trackingNumber?: string;
};
