import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/components/shop-provider";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "PUCYCLES | Custom Bike Parts",
  description: "Performance and custom parts for Triumph modern classics.",
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
