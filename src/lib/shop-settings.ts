import { createClient } from "@/lib/supabase/server";
import { defaultExchangeRates } from "@/data/commerce";
import type { CurrencyCode, ExchangeRates } from "@/types/shop";

export const DEFAULT_THAI_SHIPPING_FEE_THB = 120;

export async function getThaiShippingFee(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_thai_shipping_fee");
  if (error || data === null) return DEFAULT_THAI_SHIPPING_FEE_THB;
  const fee = Number(data);
  return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_THAI_SHIPPING_FEE_THB;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exchange_rates").select("currency, rate_from_thb");
  if (error || !data) return { ...defaultExchangeRates };
  const rates = { ...defaultExchangeRates };
  for (const row of data) {
    const currency = row.currency as CurrencyCode;
    const rate = Number(row.rate_from_thb);
    if (currency in rates && Number.isFinite(rate) && rate > 0) rates[currency] = rate;
  }
  return rates;
}
