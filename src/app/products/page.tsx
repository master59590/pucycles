import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { getCustomerSession } from "@/lib/auth/customer";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All Products & Parts",
  description: "Browse all premium custom motorcycle parts, exhaust systems, braking kits, electronics, and carbon parts for Triumph modern classics.",
  alternates: {
    canonical: `${getSiteUrl()}/products`,
  },
  openGraph: {
    title: "All Products & Parts | PUCYCLES",
    description: "Browse all premium custom motorcycle parts, exhaust systems, braking kits, electronics, and carbon parts for Triumph modern classics.",
    url: `${getSiteUrl()}/products`,
  },
};

export default async function ProductsPage() {
  const session = await getCustomerSession();
  const siteUrl = getSiteUrl();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PUCYCLES Product Catalog",
    url: `${siteUrl}/products`,
    description: "Browse all custom motorcycle parts for Triumph modern classics.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Storefront {...session} showHero={false} />
    </>
  );
}
