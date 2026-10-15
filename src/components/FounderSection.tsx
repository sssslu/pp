"use client";

import { useLanguage } from "@/i18n";
import AboutSection from "./AboutSection";
import HobbySection from "./HobbySection";
import Hairline from "./Hairline";

/**
 * 대표 소개 — 학력·경력·경험(AboutSection)과 취미(HobbySection)를 한 탭에 묶는다.
 *
 * 머리말 문구는 예전 히어로에서 가져왔다 — 'Profile : 박 슬우'와 농담 한 줄은
 * 회사 소개 페이지의 첫 화면으로는 맞지 않았지만, 대표 소개 탭의 머리로는 제자리다.
 * 탭 제목이라 본문 소제목(경력·경험·…)보다 한 단계 크게 둔다.
 *
 * 구획은 헤어라인으로 가른다: 머리말 | 경력 | 경험 | 고래+프리다이빙 | 아트.
 * 예전엔 간격만으로 이어져 탭 전체가 한 덩어리로 읽혔다. 선은 주제가 바뀌는
 * 자리에만 긋는다 — 고래 사진은 프리다이빙의 삽화라 둘 사이엔 긋지 않는다.
 */
export default function FounderSection() {
  const { t } = useLanguage();
  const rule = (
    <div className="max-w-3xl mx-auto px-6 sm:px-8">
      <Hairline />
    </div>
  );
  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-6 pb-8">
        <h2 className="text-2xl font-bold text-white">{t.hero.title}</h2>
        <p className="mt-2 text-sm text-gray-400">{t.hero.subtitle}</p>
      </div>
      {rule}
      <AboutSection />
      {rule}
      <HobbySection />
    </div>
  );
}
