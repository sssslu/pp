"use client";

import { useLanguage } from "@/i18n";
import AboutSection from "./AboutSection";
import HobbySection from "./HobbySection";

/**
 * 대표 소개 — 학력·경력·경험(AboutSection)과 취미(HobbySection)를 한 탭에 묶는다.
 *
 * 두 섹션은 손대지 않았다. 각자 자기 연출(가림 해제, 고래 소나, 라이트박스)을
 * 들고 있고 그게 멀쩡히 돌아가야 하기 때문이다. 여기는 머리말만 얹는 껍데기다.
 *
 * 머리말 문구는 예전 히어로에서 가져왔다 — 'Profile : 박 슬우'와 농담 한 줄은
 * 회사 소개 페이지의 첫 화면으로는 맞지 않았지만, 대표 소개 탭의 머리로는 제자리다.
 * 덤으로 '박슬우'가 본문 h2에 남아 이름 검색 노출 자산도 지켜진다.
 */
export default function FounderSection() {
  const { t } = useLanguage();
  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 pt-4">
        <h2 className="text-xl font-bold text-white">{t.hero.title}</h2>
        <p className="mt-2 text-sm text-gray-400">{t.hero.subtitle}</p>
      </div>
      <AboutSection />
      <HobbySection />
    </div>
  );
}
