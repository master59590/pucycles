"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { countries, formatMoney, getCountry } from "@/data/commerce";
import { POLICY_VERSION } from "@/data/policies";
import { customerErrorMessage } from "@/lib/customer-error";
import type { CustomerUser } from "@/lib/auth/customer";
import type { CheckoutAddress, CountryCode } from "@/types/shop";

const checkoutCopy = {
  en: {
    kicker: "SECURE CHECKOUT", title: "Delivery details", signedIn: "Signed in as", addressTitle: "Shipping address",
    phoneHelp: "Use a phone number the carrier can reach.", saved: "Saved delivery address loaded", fullName: "Full name",
    phone: "Phone number", country: "Country", address: "Address", city: "City / State", postal: "Postal code",
    thaiMethod: "Thai bank transfer", internationalMethod: "International shipping quote",
    thaiFlow: "Your order will be reserved and bank transfer instructions shown next.",
    internationalFlow: "Your order will be reserved. The store will confirm Thailand Post shipping before you pay by Western Union.",
    creating: "Creating order...", placeOrder: "Place order", summary: "Order summary", items: "items", shipping: "Shipping",
    pendingQuote: "Pending quote", total: "Total", confirmedLater: "Confirmed later",
    currencyNote: (currency: string) => `Currency: ${currency}. Prices use the latest shop exchange rate and the final rate is saved with the order.`,
  },
  th: {
    kicker: "ชำระเงินอย่างปลอดภัย", title: "ข้อมูลการจัดส่ง", signedIn: "เข้าสู่ระบบด้วย", addressTitle: "ที่อยู่จัดส่ง",
    phoneHelp: "กรอกเบอร์โทรที่บริษัทขนส่งสามารถติดต่อได้", saved: "โหลดที่อยู่จัดส่งที่บันทึกไว้แล้ว", fullName: "ชื่อ-นามสกุล",
    phone: "เบอร์โทรศัพท์", country: "ประเทศ", address: "ที่อยู่", city: "เมือง / จังหวัด", postal: "รหัสไปรษณีย์",
    thaiMethod: "โอนเงินผ่านธนาคารไทย", internationalMethod: "ตรวจสอบค่าจัดส่งต่างประเทศ",
    thaiFlow: "ระบบจะจองสินค้าและแสดงข้อมูลบัญชีธนาคารในขั้นตอนถัดไป",
    internationalFlow: "ระบบจะจองสินค้า จากนั้นร้านจะตรวจสอบค่าจัดส่งไปรษณีย์ไทยก่อนเปิดให้ชำระผ่าน Western Union",
    creating: "กำลังสร้างคำสั่งซื้อ...", placeOrder: "ยืนยันคำสั่งซื้อ", summary: "สรุปคำสั่งซื้อ", items: "รายการ", shipping: "ค่าจัดส่ง",
    pendingQuote: "รอตรวจสอบค่าจัดส่ง", total: "ยอดรวม", confirmedLater: "ยืนยันยอดภายหลัง",
    currencyNote: (currency: string) => `สกุลเงิน: ${currency} ราคานี้ใช้อัตราแลกเปลี่ยนล่าสุดของร้าน และระบบจะบันทึกอัตราเมื่อสร้างคำสั่งซื้อ`,
  },
} as const;

export function CheckoutForm({ user, isAdmin, savedAddress, thaiShippingFeeThb }: { user: CustomerUser; isAdmin: boolean; savedAddress: CheckoutAddress | null; thaiShippingFeeThb: number }) {
  const router = useRouter();
  const { cart, preferences, placeOrder, setPreferences, products, exchangeRates } = useShop();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [address, setAddress] = useState<CheckoutAddress>(savedAddress ?? {
    name: user.name,
    phone: "",
    address: "",
    city: "",
    countryCode: preferences.countryCode,
    postalCode: "",
  });
  const lines = useMemo(
    () => cart.flatMap((line) => {
      const product = products.find((item) => item.id === line.productId);
      return product ? [{ ...line, product }] : [];
    }),
    [cart, products],
  );
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.product.priceThb * line.quantity, 0), [lines]);
  const thai = address.countryCode === "TH";
  const shipping = thai ? thaiShippingFeeThb : null;
  const country = getCountry(address.countryCode);
  const t = checkoutCopy[preferences.locale];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart.length) return router.push("/cart");
    setSubmitting(true);
    setSubmitError("");
    try {
      setPreferences({ ...preferences, countryCode: address.countryCode });
      const orderNumber = await placeOrder(address, POLICY_VERSION);
      router.push(`/orders/${orderNumber}${thai ? "?payment=1#payment" : ""}`);
    } catch (error) {
      setSubmitError(customerErrorMessage(error, preferences.locale));
      router.refresh();
      setSubmitting(false);
    }
  };

  return <CustomerShell user={user} isAdmin={isAdmin}>
    <main className="shop-page">
      <div className="shop-page-heading"><span className="section-kicker">{t.kicker}</span><h1>{t.title}</h1><p>{t.signedIn} {user.email}</p></div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-section-title"><MapPin /><div><h2>{t.addressTitle}</h2><p>{t.phoneHelp}</p></div></div>
          {savedAddress && <div className="saved-address-notice"><Check />{t.saved}</div>}
          <div className="form-grid">
            <label className="full-field"><span>{t.fullName}</span><input required maxLength={120} value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} /></label>
            <label><span>{t.phone}</span><input required minLength={3} maxLength={40} type="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} /></label>
            <label><span>{t.country}</span><select required value={address.countryCode} onChange={(event) => setAddress({ ...address, countryCode: event.target.value as CountryCode })}>{countries.map((item) => <option key={item.code} value={item.code}>{preferences.locale === "th" ? item.nameTh : item.name}</option>)}</select></label>
            <label className="full-field"><span>{t.address}</span><textarea required minLength={3} maxLength={500} rows={3} value={address.address} onChange={(event) => setAddress({ ...address, address: event.target.value })} /></label>
            <label><span>{t.city}</span><input required maxLength={120} value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label>
            <label><span>{t.postal}</span><input required maxLength={20} value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} /></label>
          </div>
          <div className="checkout-flow-note"><LockKeyhole /><div><strong>{thai ? t.thaiMethod : t.internationalMethod}</strong><p>{thai ? t.thaiFlow : t.internationalFlow}</p></div></div>
          <label className="checkout-terms">
            <input required type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
            <span>{preferences.locale === "th" ? <>ฉันตรวจสอบรุ่นรถที่รองรับแล้ว และยอมรับ <Link href="/policies" target="_blank">นโยบายการจัดส่ง การคืนสินค้า ความเป็นส่วนตัว และเงื่อนไขการขาย</Link></> : <>I have checked the motorcycle fitment and agree to the <Link href="/policies" target="_blank">shipping, return, privacy, and sale policies</Link>.</>}</span>
          </label>
          {submitError && <p className="field-error" role="alert">{submitError}</p>}
          <button className="shop-primary-button" disabled={submitting || !acceptedTerms}>{submitting ? t.creating : <>{t.placeOrder} <ArrowRight /></>}</button>
        </form>

        <aside className="order-summary">
          <h2>{t.summary}</h2>
          <div className="checkout-items">{lines.map(({ product, quantity }) => <article key={product.id}><div className="checkout-item-thumb">{product.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={product.name} fill sizes="46px" /> : null}</div><div><strong>{preferences.locale === "th" ? product.nameTh : product.name}</strong><span>{quantity} × {formatMoney(product.priceThb, address.countryCode, preferences.locale, exchangeRates[country.currency])}</span></div></article>)}</div>
          <div><span>{cart.reduce((sum, line) => sum + line.quantity, 0)} {t.items}</span><strong>{formatMoney(subtotal, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <div><span>{t.shipping}</span><strong>{shipping === null ? t.pendingQuote : formatMoney(shipping, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <div className="summary-total"><span>{t.total}</span><strong>{shipping === null ? t.confirmedLater : formatMoney(subtotal + shipping, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <p>{t.currencyNote(country.currency)}</p>
        </aside>
      </div>
    </main>
  </CustomerShell>;
}
