"use client";

import Image from "next/image";
import { ArrowRight, Languages } from "lucide-react";
import type { Locale } from "@/types/shop";

export function FirstVisitLanguage({ ready, onSelect }: { ready: boolean; onSelect: (locale: Locale) => void }) {
  return <div className={`first-visit-language${ready ? "" : " loading"}`} role={ready ? "dialog" : "status"} aria-modal={ready ? "true" : undefined} aria-labelledby={ready ? "language-title" : undefined} aria-busy={!ready}>
    <div className="first-visit-brand">
      <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={104} height={104} priority />
      <span>PUCYCLES</span>
      <small>CUSTOM BIKE PARTS</small>
    </div>
    {ready ? <div className="first-visit-content">
      <Languages aria-hidden="true" />
      <span>WELCOME / ยินดีต้อนรับ</span>
      <h1 id="language-title">Choose your language<br /><strong>เลือกภาษาของคุณ</strong></h1>
      <div className="first-visit-options">
        <button onClick={() => onSelect("en")}><span><small>EN</small><strong>English</strong></span><ArrowRight aria-hidden="true" /></button>
        <button onClick={() => onSelect("th")}><span><small>TH</small><strong>ภาษาไทย</strong></span><ArrowRight aria-hidden="true" /></button>
      </div>
    </div> : <span className="first-visit-loading">Loading...</span>}
  </div>;
}
