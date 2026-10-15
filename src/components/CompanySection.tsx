"use client";

import { useLanguage } from "@/i18n";
import SluBrand from "./SluBrand";

/**
 * 회사소개 — 브랜드와 사업자 정보, 둘뿐이다.
 *
 * 한때 '무엇을 하는가' 문단과 원칙 카드 세 장이 더 있었지만 전부 걷어냈다.
 * 무엇을 만드는 회사인지는 서비스 탭의 제품들이 직접 보여 주는 편이 낫고,
 * 원칙을 글로 적어 두는 것보다 제품이 증거로 남는 쪽이 이 사이트에 맞는다.
 *
 * 팔레트는 사이트의 시안 계열을 그대로 쓴다. 브랜드 마크 자체의 백열색 글로우는
 * SluBrand가 자기 CSS로 들고 있어 여기 영향을 받지 않는다.
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
      <div className="flex flex-col items-center py-4 text-center">
        <SluBrand variant="lockup" size={84} />
        <p className="mt-5 text-base text-gray-200">{c.tagline}</p>
        <div className="mt-6 h-px w-full max-w-sm bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      <section className="py-5">
        <h2 className="text-xl font-bold text-white">{c.bizTitle}</h2>
        {/*
          dl로 적는다 — 라벨과 값의 쌍이라는 사실이 마크업에 남아야 스크린리더가
          '대표: 박슬우'로 읽는다. 행이 셋뿐이라 표(table)는 과하다.
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
