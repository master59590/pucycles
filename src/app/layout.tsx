import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/components/shop-provider";
import { getCatalogProducts } from "@/lib/catalog";
import { getExchangeRates } from "@/lib/shop-settings";

export const metadata: Metadata = {
  title: "PUCYCLES | Custom Bike Parts",
  description: "Performance and custom parts for Triumph modern classics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [catalogProducts, exchangeRates] = await Promise.all([getCatalogProducts(), getExchangeRates()]);
  return (
    <html lang="en">
      <body><ShopProvider catalogProducts={catalogProducts} exchangeRates={exchangeRates}>{children}</ShopProvider></body>
    </html>
  );
}
