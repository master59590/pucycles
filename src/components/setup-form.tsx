"use client";

import { Check, Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/shop-provider";
import { countries } from "@/data/commerce";
import type { CountryCode, Locale } from "@/types/shop";

export function SetupForm() {
  const router = useRouter();
  const { preferences, setPreferences } = useShop();
  const [locale, setLocale] = useState<Locale>(preferences.locale);
  const [countryCode, setCountryCode] = useState<CountryCode>(preferences.countryCode);

  const continueToShop = () => {
    setPreferences({ locale, countryCode });
    router.push("/products");
  };

  return <div className="setup-form">
    <div className="setup-icon"><Globe2 aria-hidden="true" /></div>
    <span className="section-kicker">WELCOME TO PUCYCLES</span>
    <h1>Set your shopping region</h1>
    <p>Prices, payment instructions, and delivery steps will match your country.</p>
    <fieldset><legend>Language</legend><div className="choice-grid"><button className={locale === "en" ? "selected" : ""} onClick={() => setLocale("en")}><span>EN</span><strong>English</strong>{locale === "en" && <Check />}</button><button className={locale === "th" ? "selected" : ""} onClick={() => setLocale("th")}><span>TH</span><strong>ภาษาไทย</strong>{locale === "th" && <Check />}</button></div></fieldset>
    <label className="setup-country"><span>Country</span><select value={countryCode} onChange={(event) => setCountryCode(event.target.value as CountryCode)}>{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
    <button className="shop-primary-button" onClick={continueToShop}>Continue to shop</button>
  </div>;
}
