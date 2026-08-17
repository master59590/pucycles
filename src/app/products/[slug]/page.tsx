import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getCustomerSession } from "@/lib/auth/customer";
import { getCatalogProduct } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return {};

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/products/${product.slug}`;
  const title = `${product.name} (${product.brand})`;
  const description = `${product.description} Fitment: ${product.models.join(", ")} (${product.yearFrom}-${product.yearTo}). Price: ฿${product.priceThb.toLocaleString()}`;
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];

  return {
    title,
    description,
    keywords: [
      product.name,
      product.nameTh,
      product.brand,
      product.category,
      product.sku,
      ...product.models,
      "Triumph Parts",
      "PUCYCLES",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "PUCYCLES",
      locale: "en_US",
      alternateLocale: ["th_TH"],
      images: (images.length > 0 ? images : [`${siteUrl}/pucycles-logo.jpg`]).map((url) => ({
        url,
        secureUrl: url,
        width: 1200,
        height: 630,
        type: url.endsWith(".webp") ? "image/webp" : "image/jpeg",
        alt: product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? [images[0]] : [`${siteUrl}/pucycles-logo.jpg`],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const session = await getCustomerSession();
  const siteUrl = getSiteUrl();

  const productImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [`${siteUrl}/pucycles-logo.jpg`];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: productImages,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "THB",
      price: product.priceThb,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "PUCYCLES",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TH",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "THB",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TH",
        },
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetail product={product} {...session} />
    </>
  );
}
