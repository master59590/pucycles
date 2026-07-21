import type { Product, StockStatus } from "@/data/catalog";
import { createClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  price_thb: number | string;
  weight_grams: number;
  stock_quantity: number;
  reserved_quantity: number;
  status: StockStatus;
  categories: { name_en: string } | null;
  brands: { name: string } | null;
  product_images: Array<{ storage_path: string; sort_order: number }>;
  product_vehicle_fitments: Array<{
    year_from: number;
    year_to: number;
    vehicle_models: { name: string } | null;
  }>;
};

const accents: Record<StockStatus, string> = {
  in_stock: "#b91c1c",
  low_stock: "#171717",
  out_of_stock: "#262626",
};

export async function getCatalogProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, sku, name_en, name_th, description_en, description_th, price_thb, weight_grams, stock_quantity, reserved_quantity, status, categories(name_en), brands(name), product_images(storage_path, sort_order), product_vehicle_fitments(year_from, year_to, vehicle_models(name))")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as ProductRow[]).map((row) => {
    const fitments = row.product_vehicle_fitments;
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      name: row.name_en,
      nameTh: row.name_th,
      description: row.description_en,
      descriptionTh: row.description_th,
      category: row.categories?.name_en ?? "Parts",
      brand: row.brands?.name ?? "PUCYCLES",
      models: [...new Set(fitments.flatMap((fitment) => fitment.vehicle_models?.name ? [fitment.vehicle_models.name] : []))],
      yearFrom: fitments.length ? Math.min(...fitments.map((fitment) => fitment.year_from)) : new Date().getFullYear(),
      yearTo: fitments.length ? Math.max(...fitments.map((fitment) => fitment.year_to)) : new Date().getFullYear(),
      weightGrams: row.weight_grams,
      priceThb: Number(row.price_thb),
      stockStatus: row.status,
      stock: Math.max(0, row.stock_quantity - row.reserved_quantity),
      accent: accents[row.status],
      imageUrls: row.product_images
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl),
    };
  });
}

export async function getCatalogProduct(slug: string) {
  return (await getCatalogProducts()).find((product) => product.slug === slug);
}
