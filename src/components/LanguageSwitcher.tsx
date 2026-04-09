"use client";

import { motion } from "framer-motion";
import { useLanguage, type Locale } from "@/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const isKo = locale === "ko";

  return (
    <div className="fixed top-4 right-4 z-50 select-none">
      <div className="relative flex items-center bg-gray-950/70 border border-gray-700/60 backdrop-blur-xl rounded-2xl p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Glowing sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-xl bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.35),inset_0_0_8px_rgba(34,211,238,0.1)] pointer-events-none"
          style={{ width: "calc(50% - 4px)" }}
          animate={{ left: isKo ? "4px" : "calc(50% + 0px)" }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        />

        {(["ko", "en"] as Locale[]).map((lang) => {
          const active = locale === lang;
          return (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              className={`relative z-10 w-14 py-1.5 text-xs font-bold font-mono tracking-widest rounded-xl transition-colors duration-300 ${
                active
                  ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {lang === "ko" ? "한" : "EN"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
