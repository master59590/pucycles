import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CheckoutAddress, CountryCode } from "@/types/shop";

type SavedAddressRow = {
  saved_shipping_name: string | null;
  saved_shipping_phone: string | null;
  saved_shipping_address: string | null;
  saved_shipping_city: string | null;
  saved_postal_code: string | null;
  country_code: CountryCode;
};

export async function getSavedAddress(): Promise<CheckoutAddress | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("saved_shipping_name, saved_shipping_phone, saved_shipping_address, saved_shipping_city, saved_postal_code, country_code")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as SavedAddressRow;
  if (!row.saved_shipping_name || !row.saved_shipping_phone || !row.saved_shipping_address || !row.saved_shipping_city || !row.saved_postal_code) return null;

  return {
    name: row.saved_shipping_name,
    phone: row.saved_shipping_phone,
    address: row.saved_shipping_address,
    city: row.saved_shipping_city,
    postalCode: row.saved_postal_code,
    countryCode: row.country_code,
  };
}
