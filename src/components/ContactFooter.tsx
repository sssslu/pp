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
          <button onClick={() => copyToClipboard("slu@kakao.com")} className="text-blue-400 underline font-mono">
            slu@kakao.com
          </button>
        </div>
        <div className="mt-2">
          <button onClick={() => copyToClipboard("+821045871127")} className="text-blue-400 underline font-mono">
            +821045871127
          </button>
        </div>
      </div>
    </div>
  );
}
