"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent, TouchEvent } from "react";
import { useLanguage } from "@/i18n";

export default function ProjectsSection() {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 relative z-10">
        {titles.map((title) => (
          <div key={title} className="bg-gray-900/90 border border-gray-800 rounded p-3 relative overflow-hidden group/card hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm">
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
