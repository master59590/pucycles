import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminCategory = { id: number; slug: string; nameEn: string; nameTh: string; productCount: number };
export type AdminBrand = { id: number; slug: string; name: string; productCount: number };
export type AdminVehicleModel = { id: number; slug: string; name: string; productCount: number };

export async function getCatalogTaxonomy(): Promise<{ categories: AdminCategory[]; brands: AdminBrand[]; vehicleModels: AdminVehicleModel[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { categories: [], brands: [], vehicleModels: [] };

  const [categoryResult, brandResult, modelResult, productResult, fitmentResult] = await Promise.all([
    supabase.from("categories").select("id, slug, name_en, name_th").order("name_en"),
    supabase.from("brands").select("id, slug, name").order("name"),
    supabase.from("vehicle_models").select("id, slug, name").order("name"),
    supabase.from("products").select("category_id, brand_id"),
    supabase.from("product_vehicle_fitments").select("product_id, vehicle_model_id"),
  ]);
  const error = categoryResult.error ?? brandResult.error ?? modelResult.error ?? productResult.error ?? fitmentResult.error;
  if (error) throw new Error(`Could not load catalog options: ${error.message}`);

  const categoryCounts = new Map<number, number>();
  const brandCounts = new Map<number, number>();
  const modelProducts = new Map<number, Set<string>>();
  for (const product of productResult.data ?? []) {
    if (product.category_id !== null) categoryCounts.set(Number(product.category_id), (categoryCounts.get(Number(product.category_id)) ?? 0) + 1);
    if (product.brand_id !== null) brandCounts.set(Number(product.brand_id), (brandCounts.get(Number(product.brand_id)) ?? 0) + 1);
  }
  for (const fitment of fitmentResult.data ?? []) {
    const modelId = Number(fitment.vehicle_model_id);
    const products = modelProducts.get(modelId) ?? new Set<string>();
    products.add(fitment.product_id);
    modelProducts.set(modelId, products);
  }

  return {
    categories: (categoryResult.data ?? []).map((row) => ({ id: Number(row.id), slug: row.slug, nameEn: row.name_en, nameTh: row.name_th, productCount: categoryCounts.get(Number(row.id)) ?? 0 })),
    brands: (brandResult.data ?? []).map((row) => ({ id: Number(row.id), slug: row.slug, name: row.name, productCount: brandCounts.get(Number(row.id)) ?? 0 })),
    vehicleModels: (modelResult.data ?? []).map((row) => ({ id: Number(row.id), slug: row.slug, name: row.name, productCount: modelProducts.get(Number(row.id))?.size ?? 0 })),
  };
}
