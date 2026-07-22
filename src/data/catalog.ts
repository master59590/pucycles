export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type ProductFitment = {
  model: string;
  yearFrom: number;
  yearTo: number;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  category: string;
  brand: string;
  models: string[];
  fitments?: ProductFitment[];
  yearFrom: number;
  yearTo: number;
  weightGrams: number;
  priceThb: number;
  stockStatus: StockStatus;
  stock: number;
  accent: string;
  imageUrls?: string[];
};

export const models = [
  "Triumph T100-T120",
  "Triumph Bobber 1200",
  "Triumph Thruxton R1200",
];

export const categories = [
  "Brake & Clutch Lines",
  "Handlebars",
  "Fenders",
  "Wheels",
  "Lighting & Electrical",
  "Engine Guards",
  "Seats",
  "Exhausts",
  "Carbon Parts",
];

export const brands = [
  "Motogadget",
  "ZARD Exhaust",
  "Hercules Exhaust",
  "Beringer Brake",
  "PIAA",
  "Baja",
];

export const products: Product[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "zard-2-1-full-exhaust",
    sku: "PC-001",
    name: "ZARD 2-1 Full Exhaust System",
    nameTh: "ท่อไอเสีย ZARD ฟูลซิสเต็ม 2-1",
    description: "A complete stainless steel exhaust system tuned for a deeper tone, reduced weight, and clean modern-classic lines.",
    descriptionTh: "ชุดท่อไอเสียสเตนเลสแบบเต็มระบบ ให้เสียงทุ้ม น้ำหนักเบาลง และเข้ากับเส้นสาย Modern Classic",
    category: "Exhausts",
    brand: "ZARD Exhaust",
    models: ["Triumph T100-T120", "Triumph Thruxton R1200"],
    yearFrom: 2016,
    yearTo: 2026,
    weightGrams: 6200,
    priceThb: 42500,
    stockStatus: "in_stock",
    stock: 6,
    accent: "#b91c1c",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "motogadget-motoscope-mini",
    sku: "PC-002",
    name: "Motogadget Motoscope Mini",
    nameTh: "ไมล์ดิจิทัล Motogadget Motoscope Mini",
    description: "Compact digital instrument with a crisp LED display for stripped-back custom cockpit builds.",
    descriptionTh: "เรือนไมล์ดิจิทัลขนาดเล็ก จอ LED คมชัด เหมาะกับงานคัสตอมสไตล์มินิมอล",
    category: "Lighting & Electrical",
    brand: "Motogadget",
    models: ["Triumph Bobber 1200", "Triumph T100-T120"],
    yearFrom: 2017,
    yearTo: 2026,
    weightGrams: 180,
    priceThb: 13900,
    stockStatus: "low_stock",
    stock: 2,
    accent: "#171717",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "beringer-front-brake-kit",
    sku: "PC-003",
    name: "Beringer Front Brake Kit",
    nameTh: "ชุดเบรกหน้า Beringer",
    description: "High-performance front braking package with progressive lever feel and precise control.",
    descriptionTh: "ชุดเบรกหน้าสมรรถนะสูง ให้แรงเบรกต่อเนื่องและควบคุมได้แม่นยำ",
    category: "Brake & Clutch Lines",
    brand: "Beringer Brake",
    models: ["Triumph Thruxton R1200"],
    yearFrom: 2016,
    yearTo: 2020,
    weightGrams: 3100,
    priceThb: 38400,
    stockStatus: "in_stock",
    stock: 4,
    accent: "#991b1b",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "handcrafted-ribbed-seat",
    sku: "PC-004",
    name: "Handcrafted Ribbed Seat",
    nameTh: "เบาะแต่งเย็บลาย Handmade",
    description: "Hand-shaped seat with ribbed upholstery, designed to preserve the Bobber's low profile.",
    descriptionTh: "เบาะขึ้นรูปและเย็บลายด้วยมือ ออกแบบให้คงทรงเตี้ยของ Bobber",
    category: "Seats",
    brand: "PUCYCLES",
    models: ["Triumph Bobber 1200"],
    yearFrom: 2017,
    yearTo: 2026,
    weightGrams: 2200,
    priceThb: 8900,
    stockStatus: "out_of_stock",
    stock: 0,
    accent: "#404040",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "carbon-front-fender",
    sku: "PC-005",
    name: "Carbon Front Fender",
    nameTh: "บังโคลนหน้าคาร์บอน",
    description: "Lightweight carbon-fibre front fender with a gloss finish and direct-fit mounting points.",
    descriptionTh: "บังโคลนหน้าคาร์บอนไฟเบอร์น้ำหนักเบา ผิวเงา พร้อมจุดยึดตรงรุ่น",
    category: "Carbon Parts",
    brand: "PUCYCLES",
    models: ["Triumph T100-T120", "Triumph Thruxton R1200"],
    yearFrom: 2016,
    yearTo: 2026,
    weightGrams: 620,
    priceThb: 11200,
    stockStatus: "out_of_stock",
    stock: 0,
    accent: "#262626",
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    slug: "baja-led-auxiliary-light-kit",
    sku: "PC-006",
    name: "Baja LED Auxiliary Light Kit",
    nameTh: "ชุดไฟเสริม LED Baja",
    description: "Compact high-output auxiliary lights for confident night riding and poor-weather visibility.",
    descriptionTh: "ไฟเสริมกำลังสูงขนาดกะทัดรัด เพิ่มทัศนวิสัยสำหรับการขับขี่กลางคืนและสภาพอากาศไม่ดี",
    category: "Lighting & Electrical",
    brand: "Baja",
    models: ["Triumph T100-T120", "Triumph Bobber 1200"],
    yearFrom: 2016,
    yearTo: 2026,
    weightGrams: 940,
    priceThb: 15900,
    stockStatus: "in_stock",
    stock: 8,
    accent: "#dc2626",
  },
];
