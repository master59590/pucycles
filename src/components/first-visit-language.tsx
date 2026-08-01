"use client";

import Image from "next/image";
import { ArrowRight, Globe2, Languages } from "lucide-react";
import { useState } from "react";
import { countries } from "@/data/commerce";
import type { CountryCode, Locale } from "@/types/shop";

export function FirstVisitLanguage({ ready, onSelect }: { ready: boolean; onSelect: (locale: Locale, countryCode: CountryCode) => void }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [countryCode, setCountryCode] = useState<CountryCode | "">("");

  return <div className={`first-visit-language${ready ? "" : " loading"}`} role={ready ? "dialog" : "status"} aria-modal={ready ? "true" : undefined} aria-labelledby={ready ? "language-title" : undefined} aria-busy={!ready}>
    <div className="first-visit-brand">
      <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={104} height={104} priority />
      <span>PUCYCLES</span>
      <small>CUSTOM BIKE PARTS</small>
    </div>
    {ready ? <div className="first-visit-content">
      <Languages aria-hidden="true" />
      <span>WELCOME / ยินดีต้อนรับ</span>
      <h1 id="language-title">Choose language and country<br /><strong>เลือกภาษาและประเทศ</strong></h1>
      <div className="first-visit-options">
        <button className={locale === "en" ? "selected" : ""} onClick={() => setLocale("en")}><span><small>EN</small><strong>English</strong></span></button>
        <button className={locale === "th" ? "selected" : ""} onClick={() => setLocale("th")}><span><small>TH</small><strong>ภาษาไทย</strong></span></button>
      </div>
      <label className="first-visit-country"><span><Globe2 />{locale === "th" ? "ประเทศจัดส่ง" : "Delivery country"}</span><select value={countryCode} onChange={(event) => setCountryCode(event.target.value as CountryCode)}><option value="" disabled>{locale === "th" ? "เลือกประเทศ" : "Select country"}</option>{countries.map((country) => <option key={country.code} value={country.code}>{locale === "th" ? country.nameTh : country.name}</option>)}</select></label>
      <button className="first-visit-continue" disabled={!countryCode} onClick={() => countryCode && onSelect(locale, countryCode)}>{locale === "th" ? "เข้าสู่ร้านค้า" : "Enter shop"}<ArrowRight /></button>
    </div> : <span className="first-visit-loading">Loading...</span>}
  </div>;
}
