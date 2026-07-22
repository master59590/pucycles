import "server-only";

import type { ShippingCarrier, StockMovement } from "@/lib/admin-convenience-types";
import { createClient } from "@/lib/supabase/server";

export async function getShippingCarriers(): Promise<ShippingCarrier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipping_carriers")
    .select("id, name, tracking_url_template, is_active")
    .order("sort_order")
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    trackingUrlTemplate: row.tracking_url_template,
    isActive: row.is_active,
  }));
}

export async function getStockMovements(limit = 500): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_movements")
    .select("id, product_id, quantity_before, quantity_after, quantity_delta, reason, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    quantityDelta: row.quantity_delta,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
  }));
}
