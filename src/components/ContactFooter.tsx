"use client";

import { useLanguage } from "@/i18n";

export default function ContactFooter() {
  const { t } = useLanguage();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${t.contact.copiedPrefix}${text}`);
    });
  };

  return (
    <div className="py-6 px-4 relative z-10">
      <hr className="border-gray-600" />
      <div className="text-center py-6">
        <h2 className="text-xl font-bold text-white">{t.contact.title}</h2>
        <div className="mt-2">
          <button onClick={() => copyToClipboard("slu@slupark.com")} className="text-blue-400 underline font-mono">
            slu@slupark.com
          </button>
        </div>
        {/* 사업자 한 줄 — 푸터는 사업자 정보가 놓이는 관습적인 자리고,
            모든 액자 섹션 아래에 깔리므로 'SluCompany'가 어느 탭에서나 본문에 남는다 */}
        <p className="mt-4 text-[11px] tracking-[0.14em] text-gray-500">
          {t.company.bizName} · {t.company.bizFounder}
        </p>
      </div>
    </div>
  );
}
