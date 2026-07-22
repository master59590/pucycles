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
      setSubmitError(customerErrorMessage(error));
      router.refresh();
      setSubmitting(false);
    }
  };

  return <CustomerShell user={user} isAdmin={isAdmin}>
    <main className="shop-page">
      <div className="shop-page-heading"><span className="section-kicker">SECURE CHECKOUT</span><h1>Delivery details</h1><p>Signed in as {user.email}</p></div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-section-title"><MapPin /><div><h2>Shipping address</h2><p>Use a phone number the carrier can reach.</p></div></div>
          {savedAddress && <div className="saved-address-notice"><Check />Saved delivery address loaded</div>}
          <div className="form-grid">
            <label className="full-field"><span>Full name</span><input required maxLength={120} value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} /></label>
            <label><span>Phone number</span><input required minLength={3} maxLength={40} type="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} /></label>
            <label><span>Country</span><select required value={address.countryCode} onChange={(event) => setAddress({ ...address, countryCode: event.target.value as CountryCode })}>{countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
            <label className="full-field"><span>Address</span><textarea required minLength={3} maxLength={500} rows={3} value={address.address} onChange={(event) => setAddress({ ...address, address: event.target.value })} /></label>
            <label><span>City / State</span><input required maxLength={120} value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label>
            <label><span>Postal code</span><input required maxLength={20} value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} /></label>
          </div>
          <div className="checkout-flow-note"><LockKeyhole /><div><strong>{thai ? "Thai bank transfer" : "International shipping quote"}</strong><p>{thai ? "Your order will be reserved and bank transfer instructions shown next." : "Your order will be reserved. The store will confirm Thailand Post shipping before you pay by Western Union."}</p></div></div>
          <label className="checkout-terms">
            <input required type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
            <span>{preferences.locale === "th" ? <>ฉันตรวจสอบรุ่นรถที่รองรับแล้ว และยอมรับ <Link href="/policies" target="_blank">นโยบายการจัดส่ง การคืนสินค้า ความเป็นส่วนตัว และเงื่อนไขการขาย</Link></> : <>I have checked the motorcycle fitment and agree to the <Link href="/policies" target="_blank">shipping, return, privacy, and sale policies</Link>.</>}</span>
          </label>
          {submitError && <p className="field-error" role="alert">{submitError}</p>}
          <button className="shop-primary-button" disabled={submitting || !acceptedTerms}>{submitting ? "Creating order..." : <>Place order <ArrowRight /></>}</button>
        </form>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="checkout-items">{lines.map(({ product, quantity }) => <article key={product.id}><div className="checkout-item-thumb">{product.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={product.name} fill sizes="46px" /> : null}</div><div><strong>{preferences.locale === "th" ? product.nameTh : product.name}</strong><span>{quantity} × {formatMoney(product.priceThb, address.countryCode, preferences.locale, exchangeRates[country.currency])}</span></div></article>)}</div>
          <div><span>{cart.reduce((sum, line) => sum + line.quantity, 0)} items</span><strong>{formatMoney(subtotal, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <div><span>Shipping</span><strong>{shipping === null ? "Pending quote" : formatMoney(shipping, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <div className="summary-total"><span>Total</span><strong>{shipping === null ? "Confirmed later" : formatMoney(subtotal + shipping, address.countryCode, preferences.locale, exchangeRates[country.currency])}</strong></div>
          <p>Currency: {country.currency}. Prices use the latest shop exchange rate and the final rate is saved with the order.</p>
        </aside>
      </div>
    </main>
  </CustomerShell>;
}
