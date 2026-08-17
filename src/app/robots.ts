import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/*", "/policies"],
        disallow: [
          "/admin",
          "/admin/*",
          "/setup",
          "/setup/*",
          "/checkout",
          "/checkout/*",
          "/orders",
          "/orders/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
