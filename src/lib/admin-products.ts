import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { StockStatus } from "@/data/catalog";

export type AdminProductImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  sortOrder: number;
};

export type AdminProductFitment = {
  id: string;
  vehicleModelId: number;
  vehicleModelName: string;
  yearFrom: number;
  yearTo: number;
};

export type AdminProduct = {
  id: string;
  sku: string;
  slug: string;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  priceThb: number;
  weightGrams: number;
  stockQuantity: number;
  reservedQuantity: number;
  status: StockStatus;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  isActive: boolean;
  fitments: AdminProductFitment[];
  images: AdminProductImage[];
};

export type AdminProductReference = { id: number; name: string };
export type AdminProductData = {
  products: AdminProduct[];
  categories: AdminProductReference[];
  brands: AdminProductReference[];
  vehicleModels: AdminProductReference[];
};

type ProductRow = {
  id: string;
  sku: string;
  slug: string;
  name_en: string;
  name_th: string;
  description_en: string;
  description_th: string;
  price_thb: number | string;
  weight_grams: number;
  stock_quantity: number;
  reserved_quantity: number;
  status: StockStatus;
  category_id: number;
  brand_id: number;
  is_active: boolean;
  categories: { name_en: string } | null;
  brands: { name: string } | null;
  product_images: Array<{ id: string; storage_path: string; sort_order: number }>;
  product_vehicle_fitments: Array<{
    id: string;
    vehicle_model_id: number;
    year_from: number;
    year_to: number;
    vehicle_models: { name: string } | null;
  }>;
};

export async function getAdminProductData(): Promise<AdminProductData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { products: [], categories: [], brands: [], vehicleModels: [] };

  const [productResult, categoryResult, brandResult, modelResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, slug, name_en, name_th, description_en, description_th, price_thb, weight_grams, stock_quantity, reserved_quantity, status, category_id, brand_id, is_active, categories(name_en), brands(name), product_images(id, storage_path, sort_order), product_vehicle_fitments(id, vehicle_model_id, year_from, year_to, vehicle_models(name))")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name_en").order("name_en"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("vehicle_models").select("id, name").order("name"),
  ]);

  const error = productResult.error ?? categoryResult.error ?? brandResult.error ?? modelResult.error;
  if (error) throw new Error(`Could not load product management data: ${error.message}`);

  const products = ((productResult.data ?? []) as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    nameEn: row.name_en,
    nameTh: row.name_th,
    descriptionEn: row.description_en,
    descriptionTh: row.description_th,
    priceThb: Number(row.price_thb),
    weightGrams: row.weight_grams,
    stockQuantity: row.stock_quantity,
    reservedQuantity: row.reserved_quantity,
    status: row.status,
    categoryId: row.category_id,
    categoryName: row.categories?.name_en ?? "Uncategorized",
    brandId: row.brand_id,
    brandName: row.brands?.name ?? "Unbranded",
    isActive: row.is_active,
    fitments: row.product_vehicle_fitments
      .map((fitment) => ({
        id: fitment.id,
        vehicleModelId: fitment.vehicle_model_id,
        vehicleModelName: fitment.vehicle_models?.name ?? "Unknown model",
        yearFrom: fitment.year_from,
        yearTo: fitment.year_to,
      }))
      .sort((a, b) => a.vehicleModelName.localeCompare(b.vehicleModelName)),
    images: row.product_images
      .map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        publicUrl: supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl,
        sortOrder: image.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return {
    products,
    categories: (categoryResult.data ?? []).map((row) => ({ id: Number(row.id), name: row.name_en })),
    brands: (brandResult.data ?? []).map((row) => ({ id: Number(row.id), name: row.name })),
    vehicleModels: (modelResult.data ?? []).map((row) => ({ id: Number(row.id), name: row.name })),
  };
}
