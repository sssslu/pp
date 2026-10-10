"use client";

import { useLanguage } from "@/i18n";
import SluBrand from "./SluBrand";

/**
 * 회사소개 — 이 사이트의 첫 탭이자 '우리는 무슨 회사인가'에 답하는 자리.
 *
 * 예전엔 이 사이트에 이 질문의 답이 없었다. 브랜드 락업은 프로젝트 탭 머리에
 * 작게 얹혀 있었고(이제 여기로 옮겼다), 나머지는 전부 개인 이력이었다.
 *
 * 원칙 세 개는 지어낸 구호가 아니라 제품 설명에 이미 있던 말을 끌어올린 것이다 —
 * everLae의 '광고도 결제도 한도도 없다', 애벌레노트의 '에버노트의 복잡함을 비판하며
 * 설계했다'. 제품이 증거인 원칙만 적는다.
 *
 * 팔레트는 사이트의 시안 계열을 그대로 쓴다. 브랜드 가이드(BRANDING.md §7)는
 * 차가운 네온을 금지하지만, 전환 범위를 '구조만'으로 잡은 결정에 따라 색은 두었다.
 * 브랜드 마크 자체의 백열색 글로우는 SluBrand가 자기 CSS로 들고 있어 영향받지 않는다.
 */
export default function CompanySection() {
  const { t } = useLanguage();
  const c = t.company;

  const bizRows: readonly [string, string][] = [
    [c.bizNameLabel, c.bizName],
    [c.bizFounderLabel, c.bizFounder],
  ];

  return (
    <div className="max-w-3xl mx-auto px-8 py-4">
      {/* 회사 얼굴 — 락업(마크 + 워드마크)을 한 번 크게 세운다 */}
      <div className="flex flex-col items-center py-4 text-center">
        <SluBrand variant="lockup" size={84} />
        <p className="mt-5 max-w-xl text-base text-gray-200 leading-relaxed">
          {c.tagline}
        </p>
        <div className="mt-6 h-px w-full max-w-sm bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      <section className="py-5">
        <h2 className="text-xl font-bold text-white">{c.whatTitle}</h2>
        <p className="mt-3 text-gray-300 leading-relaxed">{c.what}</p>
      </section>

      <section className="py-5">
        <h2 className="text-xl font-bold text-white">{c.principlesTitle}</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {c.principles.map((p) => (
            <div
              key={p.title}
              className="text-glow-none bg-gray-900/90 border border-gray-800 rounded p-3 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm"
            >
              <h3 className="font-bold text-sm text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-5">
        <h2 className="text-xl font-bold text-white">{c.bizTitle}</h2>
        {/*
          dl로 적는다 — 라벨과 값의 쌍이라는 사실이 마크업에 남아야 스크린리더가
          '대표: 박슬우'로 읽는다. 표(table)는 행이 하나짜리 열 둘이라 과하다.
        */}
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {bizRows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-16 shrink-0 text-gray-500">{label}</dt>
              <dd className="text-gray-300">{value}</dd>
            </div>
          ))}
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-gray-500">{c.bizContactLabel}</dt>
            <dd>
              <a href="mailto:slu@slupark.com" className="text-blue-400 underline font-mono">
                slu@slupark.com
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
