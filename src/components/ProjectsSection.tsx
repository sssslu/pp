"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent, TouchEvent } from "react";
import { useLanguage } from "@/i18n";

interface ProjectsSectionProps {
  /** 홍보 카드로 외부 사이트를 열기 직전 호출 — BGM을 꺼서 소리가 겹치지 않게 한다 */
  onExternalNav?: () => void;
}

export default function ProjectsSection({ onExternalNav }: ProjectsSectionProps) {
  const { t } = useLanguage();
  const titles = Object.keys(t.projects.descriptions);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(6, 182, 212, 0.15), transparent 80%)`;

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  function handleTouchMove({ currentTarget, touches }: TouchEvent) {
    if (touches.length > 0) {
      const { left, top } = currentTarget.getBoundingClientRect();
      const { clientX, clientY } = touches[0];
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
  }

  return (
    <div 
      className="p-4 relative group" 
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Spotlight Overlay - 마우스 주변을 은은하게 밝히는 사이버펑크 광원 */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 z-20"
        style={{ background: spotlightBackground }}
      />
      {/* 홍보 카드: 최상단에서 눈에 띄게 — 그라디언트 테두리 + 배지 + 호버 광택, 클릭 시 새 탭 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 mb-4">
        {t.projects.featured.map((p) => (
          <a
            key={p.title}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // 전파를 끊는다: window의 재생 동의 리스너가 이 클릭으로 BGM을 되살리면 안 된다
              e.stopPropagation();
              onExternalNav?.();
            }}
            className="text-glow-none group/feat relative block rounded-lg p-[1.5px] bg-gradient-to-br from-cyan-400/90 via-sky-500/40 to-fuchsia-500/90 shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all duration-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.55)] hover:-translate-y-0.5"
          >
            <div className="relative h-full rounded-[7px] bg-gray-950/95 p-4 overflow-hidden backdrop-blur-sm">
              {/* 호버 시 카드를 쓸고 지나가는 광택 */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover/feat:translate-x-full"
              />
              <span className="absolute top-3 right-3 rounded-full border border-amber-300/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-300">
                ★ {t.projects.featuredBadge}
              </span>
              <h3 className="pr-16 text-lg font-bold text-white transition-colors group-hover/feat:text-cyan-300">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">{p.description}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300/90 transition-colors group-hover/feat:text-cyan-200">
                {t.projects.visit}
                <span aria-hidden className="transition-transform duration-300 group-hover/feat:translate-x-1">→</span>
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 relative z-10">
        {titles.map((title) => (
          <div key={title} className="text-glow-none bg-gray-900/90 border border-gray-800 rounded p-3 relative overflow-hidden group/card hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm">
            <h3 className="font-bold text-base text-white group-hover/card:text-cyan-400 transition-colors">{title}</h3>
            <p
              className="mt-2 text-sm text-gray-300 overflow-hidden text-ellipsis"
              style={{ display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical' }}
            >
              {t.projects.descriptions[title]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
