import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { getCustomerSession } from "@/lib/auth/customer";
import { defaultSeo, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "PUCYCLES | Performance & Custom Motorcycle Parts",
  description: defaultSeo.description,
  alternates: {
    canonical: getSiteUrl(),
  },
};

export default async function Home() {
  const session = await getCustomerSession();
  const siteUrl = getSiteUrl();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PUCYCLES",
    url: siteUrl,
    description: defaultSeo.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PUCYCLES",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    description: defaultSeo.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Storefront {...session} />
    </>
  );
}
