export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://pucycles.vercel.app";
}

export const defaultSeo = {
  name: "PUCYCLES",
  title: "PUCYCLES | Performance & Custom Motorcycle Parts",
  description: "Performance and handcrafted custom parts for Triumph modern classic motorcycles. Worldwide shipping, exact model fitment, and premium build quality.",
  keywords: [
    "Triumph Motorcycle Parts",
    "Custom Bike Parts",
    "Triumph Bobber 1200",
    "Triumph Thruxton",
    "Triumph Bonneville T100 T120",
    "ZARD Exhaust",
    "Motogadget",
    "Beringer Brake",
    "PUCYCLES",
    "Motorcycle Accessories",
    "อะไหล่แต่งมอเตอร์ไซค์",
    "ท่อแต่ง Triumph",
  ],
};
