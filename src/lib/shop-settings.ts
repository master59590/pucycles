import { createClient } from "@/lib/supabase/server";

export const DEFAULT_THAI_SHIPPING_FEE_THB = 120;

export async function getThaiShippingFee(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_thai_shipping_fee");
  if (error || data === null) return DEFAULT_THAI_SHIPPING_FEE_THB;
  const fee = Number(data);
  return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_THAI_SHIPPING_FEE_THB;
}
