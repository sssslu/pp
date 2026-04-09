"use client";

import { useLanguage } from "@/i18n";

export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="w-full py-72 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          {t.hero.title}
        </h1>
        <p className="mt-6 text-base text-gray-300 leading-relaxed">
          {t.hero.subtitle}<br />
        </p>
      </div>
    </section>
  );
}
