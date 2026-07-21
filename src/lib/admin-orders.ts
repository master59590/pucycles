import "server-only";

import { getCountry } from "@/data/commerce";
import { createClient } from "@/lib/supabase/server";
import type { CountryCode, CurrencyCode, OrderStatus } from "@/types/shop";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_country: CountryCode;
  shipping_address: string;
  shipping_city: string;
  postal_code: string;
  currency: CurrencyCode;
  exchange_rate_from_thb: number | string;
  subtotal_thb: number | string;
  shipping_fee_thb: number | string | null;
  total_thb: number | string | null;
  status: OrderStatus;
  payment_method: "bank_transfer" | "western_union";
  shipping_company: string | null;
  tracking_number: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name_snapshot: string;
    sku_snapshot: string;
    quantity: number;
    unit_price_thb: number | string;
  }>;
  payment_proofs: {
    storage_path: string;
    status: "pending" | "approved" | "rejected";
  } | Array<{
    storage_path: string;
    status: "pending" | "approved" | "rejected";
  }> | null;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  countryCode: CountryCode;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  currency: CurrencyCode;
  exchangeRate: number;
  subtotalThb: number;
  shippingFeeThb: number | null;
  totalThb: number | null;
  status: OrderStatus;
  paymentMethod: "bank_transfer" | "western_union";
  shippingCompany: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceThb: number;
  }>;
  proofStatus: "pending" | "approved" | "rejected" | null;
  proofUrl: string | null;
};

function getProof(row: OrderRow) {
  return Array.isArray(row.payment_proofs) ? row.payment_proofs[0] ?? null : row.payment_proofs;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, shipping_country, shipping_address, shipping_city, postal_code, currency, exchange_rate_from_thb, subtotal_thb, shipping_fee_thb, total_thb, status, payment_method, shipping_company, tracking_number, created_at, order_items(id, product_name_snapshot, sku_snapshot, quantity, unit_price_thb), payment_proofs(storage_path, status)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load admin orders: ${error.message}`);

  return Promise.all(((data ?? []) as unknown as OrderRow[]).map(async (row) => {
    const proof = getProof(row);
    let proofUrl: string | null = null;

    if (proof) {
      const { data: signed } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(proof.storage_path, 10 * 60);
      proofUrl = signed?.signedUrl ?? null;
    }

    return {
      id: row.id,
      orderNumber: row.order_number,
      customer: row.customer_name,
      phone: row.customer_phone,
      countryCode: row.shipping_country,
      country: getCountry(row.shipping_country).name,
      address: row.shipping_address,
      city: row.shipping_city,
      postalCode: row.postal_code,
      currency: row.currency,
      exchangeRate: Number(row.exchange_rate_from_thb),
      subtotalThb: Number(row.subtotal_thb),
      shippingFeeThb: row.shipping_fee_thb === null ? null : Number(row.shipping_fee_thb),
      totalThb: row.total_thb === null ? null : Number(row.total_thb),
      status: row.status,
      paymentMethod: row.payment_method,
      shippingCompany: row.shipping_company,
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      items: row.order_items.map((item) => ({
        id: item.id,
        name: item.product_name_snapshot,
        sku: item.sku_snapshot,
        quantity: item.quantity,
        unitPriceThb: Number(item.unit_price_thb),
      })),
      proofStatus: proof?.status ?? null,
      proofUrl,
    };
  }));
}
