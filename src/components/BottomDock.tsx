"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";

/**
 * 화면 하단에 손잡이만 살짝 보이다가, 마우스를 올리거나 터치하면
 * 위로 슥 올라와 탭 네비게이션이 되는 도크.
 *
 * - 데스크톱: 하단 중앙 존에 hover → 펼침, 벗어나면 접힘
 * - 터치 기기: 도크 터치 → 펼침, 바깥 터치 또는 일정 시간 무입력 시 접힘
 * - 섹션 패널이 열려 있는 동안엔 항상 펼침 (네비게이션 역할)
 * - 첫 진입 시 한 번 슬쩍 올라왔다 내려가며 존재를 알린다
 */

const PEEK_PX = 22;         // 접힘 상태에서 화면에 남겨둘 높이(손잡이 부분)
const TOUCH_IDLE_MS = 4000; // 터치 기기에서 마지막 상호작용 후 자동 접힘까지
const INTRO_SHOW_MS = 1200; // 첫 진입 힌트: 올라오는 시점
const INTRO_HIDE_MS = 4000; // 첫 진입 힌트: 다시 접히는 시점

interface BottomDockProps {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function BottomDock({ selectedIndex, onSelect }: BottomDockProps) {
  const { t } = useLanguage();
  const [engaged, setEngaged] = useState(false);
  const [peekY, setPeekY] = useState(120); // 측정 전엔 확실히 아래에 숨겨둔다
  const wrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introDone = useRef(false);
  const openRef = useRef(false);
  /** 접힌 채 터치로 펼치는 동안엔 탭 클릭을 무시한다 (올라오던 탭이 손가락 밑에 걸리는 오작동 방지) */
  const suppressClicksUntil = useRef(0);

  const open = engaged || selectedIndex !== null;
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // 접힘 오프셋 = 도크 실제 높이 - 남겨둘 높이.
  // safe-area 패딩만큼 빼서, 손잡이가 iOS 홈 인디케이터/제스처 영역 위에 남게 한다.
  useEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    const update = () => {
      const paddingBottom = parseFloat(getComputedStyle(el).paddingBottom) || 12;
      const safeInset = Math.max(0, paddingBottom - 12);
      setPeekY(Math.max(0, el.offsetHeight - PEEK_PX - safeInset));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const engage = useCallback(() => {
    introDone.current = true;
    setEngaged(true);
  }, []);

  const disengage = useCallback(() => setEngaged(false), []);

  const touchEngage = useCallback(() => {
    if (!openRef.current) suppressClicksUntil.current = Date.now() + 400;
    engage();
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setEngaged(false), TOUCH_IDLE_MS);
  }, [engage]);

  const handleTabClick = useCallback((index: number) => {
    if (Date.now() < suppressClicksUntil.current) return;
    onSelect(index);
  }, [onSelect]);

  // 도크 바깥 터치 시 즉시 접힘
  useEffect(() => {
    const onDocTouch = (e: TouchEvent) => {
      const wrap = wrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) setEngaged(false);
    };
    document.addEventListener("touchstart", onDocTouch, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onDocTouch);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  // 첫 진입 힌트: 사용자가 먼저 만지지 않았다면 한 번 올라왔다 내려간다
  useEffect(() => {
    const show = setTimeout(() => {
      if (!introDone.current) setEngaged(true);
    }, INTRO_SHOW_MS);
    const hide = setTimeout(() => {
      if (!introDone.current) setEngaged(false);
    }, INTRO_HIDE_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-40 flex justify-center pointer-events-none">
      {/* 호버/터치 감지 존: 도크가 숨어 있어도 이 영역에 닿으면 올라온다 */}
      <div
        ref={wrapRef}
        className="pointer-events-auto flex justify-center pt-4"
        onMouseEnter={engage}
        onMouseLeave={disengage}
        onTouchStart={touchEngage}
        onFocusCapture={engage}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) disengage();
        }}
      >
        <motion.div
          ref={pillRef}
          className="flex flex-col items-center rounded-t-2xl border border-b-0 border-gray-700/60 bg-gray-950/70 backdrop-blur-xl px-2.5 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          initial={false}
          animate={{ y: open ? 0 : peekY }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
          onAnimationComplete={() => {
            // 도크가 다 올라와 탭이 멈췄으면 그때부턴 탭이 유효하다
            if (openRef.current) suppressClicksUntil.current = 0;
          }}
        >
          {/* 손잡이 */}
          <div className="pt-2 pb-1.5">
            <div
              className={`h-1 w-10 rounded-full transition-colors duration-300 ${
                open ? "bg-gray-400" : "bg-gray-500 dock-handle-breathe"
              }`}
            />
          </div>

          <motion.div
            className="flex items-center gap-0.5 sm:gap-1"
            animate={{ opacity: open ? 1 : 0.4 }}
            transition={{ duration: 0.25 }}
          >
            {t.tabs.map((label, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={index}
                  data-dock-tab={index}
                  onClick={() => handleTabClick(index)}
                  aria-current={isSelected ? "page" : undefined}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[13px] sm:text-sm whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-white font-bold bg-white/10"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {label}
                  <div
                    className={`mt-0.5 h-[2px] mx-auto transition-all duration-300 ${
                      isSelected ? "w-5 bg-white" : "w-0 bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </nav>
  );
}
