"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { SECTIONS, SECTION_PANEL_ID } from "@/lib/sections";

/**
 * 화면 하단에 항상 떠 있는 네온 사이버펑크 네비 바.
 *
 * - 숨지 않는다: 데스크톱/모바일 구분 없이 처음부터 보이고, 테두리·광원이
 *   천천히 숨쉬다 네온 특유의 짧은 깜빡임을 섞으며 존재를 알린다(globals.css).
 * - 선택된 탭 뒤로 발광 캡슐이 slide 하며 따라온다(framer layoutId).
 * - 모바일 하단 브라우저바/제스처 영역을 피하려 safe-area 만큼 띄워 올린다.
 * - data-dock-tab 속성은 page.tsx가 Escape/닫기 후 포커스를 되돌릴 때 쓴다.
 * - 탭은 링크가 아니라 같은 패널 하나를 여닫는 토글이다. 그래서 '현재 문서'를 뜻하는
 *   aria-current="page"가 아니라 디스클로저 시맨틱(aria-expanded + aria-controls)으로 알린다.
 * - 섹션 목록의 진실은 @/lib/sections이고, 라벨만 로케일에서 같은 인덱스로 가져온다.
 */

interface BottomDockProps {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function BottomDock({ selectedIndex, onSelect }: BottomDockProps) {
  const { t } = useLanguage();

  return (
    <nav
      // TODO(i18n): 로케일에 a11y 네임스페이스가 생기면 t.a11y.sectionNav로 교체
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.85rem)" }}
    >
      <motion.div
        initial={{ y: 96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.5 }}
        className="pointer-events-auto"
      >
        <div className="dock-neon relative flex items-center gap-0.5 rounded-2xl bg-gray-950/70 px-1.5 py-1.5 backdrop-blur-xl">
          {SECTIONS.map((section, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={section.id}
                data-dock-tab={index}
                onClick={() => onSelect(index)}
                aria-expanded={isSelected}
                aria-controls={SECTION_PANEL_ID}
                className={`relative rounded-xl px-2.5 sm:px-3.5 py-2 text-[13px] sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  isSelected ? "text-white" : "text-gray-400 hover:text-cyan-200"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-xl border border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_18px_rgba(34,211,238,0.45)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={`relative ${
                    isSelected ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]" : ""
                  }`}
                >
                  {t.tabs[index]}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
