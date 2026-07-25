"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ko } from "./locales/ko";
import { en } from "./locales/en";
import type { Translations } from "./locales/ko";

export type Locale = "ko" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  // 저장된 선택만 복원한다. navigator.language 기반 자동 전환은 일부러 하지 않는다 —
  // 크롤러(Googlebot)의 렌더 로케일이 en-US라, 자동 전환을 두면 구글이 색인하는 DOM이
  // 통째로 영어가 되어 <html lang="ko">·한국어 메타데이터와 어긋난다. "박슬우" 이름
  // 검색 노출이 이 사이트의 목적이므로 기본은 항상 한국어이고, 영어권 방문자는 우상단
  // 스위처로 한 번에 바꾼다(선택은 저장된다). 덤으로 SSR과 첫 렌더의 텍스트가 일치해
  // 하이드레이션 직후 화면 전체가 한 프레임 뒤집히던 것도 사라진다.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "ko" || stored === "en") setLocaleState(stored);
    } catch {}
  }, []);

  // <html lang>을 실제 표시 언어와 일치시킨다 (SSR 기본값은 layout의 ko)
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    // 프라이빗 모드/저장소 차단 환경에서 던지는 예외가 전환 자체를 막으면 안 된다
    try { localStorage.setItem("lang", l); } catch {}
  };

  const t = locale === "ko" ? ko : en;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
