"use client";

import { useLanguage } from "@/i18n";

/** 화면 상단에 고정되는 프로필 타이틀. 중앙은 회전 도형을 위해 비워둔다. */
export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="w-full px-6 pt-[13vh] sm:pt-[15vh]">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t.hero.title}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed">
          {t.hero.subtitle}
        </p>
      </div>
    </section>
  );
}
