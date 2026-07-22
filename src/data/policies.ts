export const POLICY_VERSION = "2026-07-22";

export const policySections = [
  {
    id: "shipping",
    title: "Shipping",
    titleTh: "การจัดส่ง",
    body: [
      "Thailand shipping is shown before the order is placed. International shipping is quoted manually using destination, parcel weight, and the available Thailand Post service.",
      "International customers must accept the final shipping quote before payment. Import duties, taxes, customs charges, and destination handling fees are the customer's responsibility unless the order states otherwise.",
    ],
    bodyTh: [
      "ค่าจัดส่งภายในประเทศไทยจะแสดงก่อนสร้างคำสั่งซื้อ ส่วนค่าจัดส่งต่างประเทศร้านจะตรวจสอบจากประเทศปลายทาง น้ำหนักพัสดุ และบริการของไปรษณีย์ไทย",
      "ลูกค้าต่างประเทศต้องยืนยันค่าจัดส่งก่อนชำระเงิน ภาษีนำเข้า อากรศุลกากร และค่าธรรมเนียมปลายทางเป็นความรับผิดชอบของลูกค้า เว้นแต่ระบุไว้เป็นอย่างอื่นในคำสั่งซื้อ",
    ],
  },
  {
    id: "returns",
    title: "Returns and refunds",
    titleTh: "การคืนสินค้าและคืนเงิน",
    body: [
      "Contact PUCYCLES before returning any item. Keep the product, packaging, accessories, and proof of purchase complete while the request is reviewed.",
      "Installed, used, modified, damaged, or incorrectly selected fitment items may not be eligible for return. Approved refunds are processed manually using an agreed method.",
    ],
    bodyTh: [
      "กรุณาติดต่อ PUCYCLES ก่อนส่งสินค้าคืน และเก็บสินค้า บรรจุภัณฑ์ อุปกรณ์ และหลักฐานการซื้อให้ครบระหว่างการตรวจสอบ",
      "สินค้าที่ติดตั้ง ใช้งาน ดัดแปลง เสียหาย หรือเลือกรุ่นรถผิด อาจไม่สามารถคืนได้ การคืนเงินที่ได้รับอนุมัติจะดำเนินการด้วยวิธีที่ร้านและลูกค้าตกลงกัน",
    ],
  },
  {
    id: "warranty",
    title: "Product warranty",
    titleTh: "การรับประกันสินค้า",
    body: [
      "Manufacturer warranty applies only when supplied with the product. Warranty does not cover incorrect fitment, improper installation, modification, accident, misuse, or normal wear.",
      "Confirm the motorcycle model and year before ordering. Professional installation is recommended for braking, electrical, wheel, and exhaust components.",
    ],
    bodyTh: [
      "การรับประกันจากผู้ผลิตมีผลเฉพาะสินค้าที่ระบุว่ามีการรับประกัน ไม่ครอบคลุมการเลือกรุ่นผิด การติดตั้งไม่ถูกต้อง การดัดแปลง อุบัติเหตุ การใช้งานผิดวิธี หรือการสึกหรอตามปกติ",
      "กรุณาตรวจสอบรุ่นและปีรถก่อนสั่งซื้อ และแนะนำให้ช่างผู้ชำนาญติดตั้งอุปกรณ์เบรก ไฟฟ้า ล้อ และท่อไอเสีย",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    titleTh: "ความเป็นส่วนตัว",
    body: [
      "We use Google sign-in information, contact details, delivery addresses, order records, and payment proof images only to operate the shop, fulfil orders, prevent misuse, and provide support.",
      "Shop data is handled through service providers including Google, Supabase, and the website host. Payment proof images are private and available only to the customer who uploaded them and the store administrator.",
    ],
    bodyTh: [
      "เราใช้ข้อมูลจาก Google ชื่อ เบอร์โทร ที่อยู่ ประวัติคำสั่งซื้อ และรูปหลักฐานการชำระเงิน เพื่อดำเนินร้านค้า จัดส่งสินค้า ป้องกันการใช้งานผิดวัตถุประสงค์ และให้ความช่วยเหลือเท่านั้น",
      "ข้อมูลร้านค้าดำเนินการผ่านผู้ให้บริการ เช่น Google, Supabase และผู้ให้บริการเว็บไซต์ รูปหลักฐานการชำระเงินเป็นข้อมูลส่วนตัวที่เข้าถึงได้เฉพาะลูกค้าผู้อัปโหลดและผู้ดูแลร้าน",
    ],
  },
  {
    id: "terms",
    title: "Terms of sale",
    titleTh: "เงื่อนไขการขาย",
    body: [
      "Product prices are based in Thai baht. Other currencies use the shop exchange rate for display and are saved with the order. A submitted order reserves stock only until the payment deadline shown on the order.",
      "Payment is confirmed only after the store approves the uploaded receipt. PUCYCLES may cancel and release stock for expired, unpaid, fraudulent, or unverifiable orders.",
    ],
    bodyTh: [
      "ราคาสินค้ามีเงินบาทเป็นราคาหลัก สกุลเงินอื่นคำนวณด้วยอัตราแลกเปลี่ยนของร้านและบันทึกไว้กับคำสั่งซื้อ การสร้างคำสั่งซื้อจะจองสินค้าไว้ถึงกำหนดชำระที่แสดงในออเดอร์เท่านั้น",
      "ถือว่าชำระเงินสำเร็จเมื่อร้านตรวจและอนุมัติหลักฐานแล้ว PUCYCLES อาจยกเลิกและคืนสต็อกสำหรับออเดอร์ที่หมดเวลา ไม่ชำระ มีความเสี่ยงทุจริต หรือไม่สามารถตรวจสอบได้",
    ],
  },
] as const;
