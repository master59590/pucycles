import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getCustomerSession } from "@/lib/auth/customer";
import { getCatalogProduct } from "@/lib/catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const session = await getCustomerSession();
  return <ProductDetail product={product} {...session} />;
}
