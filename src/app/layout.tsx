import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/components/shop-provider";
import { getCatalogProducts } from "@/lib/catalog";

import { defaultSeo, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultSeo.title,
    template: "%s | PUCYCLES",
  },
  description: defaultSeo.description,
  keywords: defaultSeo.keywords,
  authors: [{ name: "PUCYCLES" }],
  creator: "PUCYCLES",
  publisher: "PUCYCLES",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["th_TH"],
    url: getSiteUrl(),
    siteName: defaultSeo.name,
    title: defaultSeo.title,
    description: defaultSeo.description,
    images: [
      {
        url: `${getSiteUrl()}/pucycles-logo.jpg`,
        width: 1200,
        height: 630,
        alt: defaultSeo.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeo.title,
    description: defaultSeo.description,
    images: [`${getSiteUrl()}/pucycles-logo.jpg`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalogProducts = await getCatalogProducts();
  return (
    <html lang="en">
      <body><ShopProvider catalogProducts={catalogProducts}>{children}</ShopProvider></body>
    </html>
  );
}
