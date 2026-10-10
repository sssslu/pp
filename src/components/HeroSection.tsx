"use client";

import { useLanguage } from "@/i18n";
import SluBrand from "./SluBrand";

/**
 * 대기 화면의 회사 얼굴. 패널이 열리면 page.tsx가 비켜 준다.
 *
 * 예전엔 'Profile : 박 슬우' + 농담 한 줄이었다 — 개인 포트폴리오의 1인칭 표지라
 * 회사 소개 페이지의 첫 화면으로는 맞지 않았다(그 문구는 대표 탭 머리로 옮겼다).
 *
 * 워드마크는 SluBrand가 아니라 텍스트가 맡는다. SluBrand는 role="img" +
 * aria-label 구조라 마크 안의 'SluCompany'는 색인되는 본문이 아니고, 이 페이지의
 * h1은 실제 텍스트여야 한다. 그래서 마크(variant="mark")만 쓰고 이름은 아래에 적는다.
 *
 * 대표 줄을 남겨 둔 이유: 이름 검색 노출이 이 사이트의 1순위 목표다. h1을 회사명이
 * 가져가면 '박슬우'가 가장 무거운 요소에서 빠지므로, 대기 화면에 이름이 보이게 둔다.
 */
export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="w-full px-6 pt-[13vh] sm:pt-[15vh]">
      <div className="flex flex-col items-center text-center">
        <SluBrand variant="mark" size={72} />
        <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-white">SluCompany</h1>
        <p className="mt-1.5 text-[11px] font-medium tracking-[0.22em] text-gray-500">
          슬루컴패니
        </p>
        <p className="mt-4 max-w-md text-sm sm:text-base text-gray-300 leading-relaxed">
          {t.company.tagline}
        </p>
        <p className="mt-3 text-xs text-gray-500">{t.company.founderLine}</p>
      </div>
    </section>
  );
}
