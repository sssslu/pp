"use client";

import { useMemo, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/i18n";

const SKILLS = [
  "C", "C#", "Java", "Dart", "React", "Flutter",
  "Next.js", "Python", "Node.js", "JavaScript",
  "TypeScript", "Firebase Auth", "DB의 SQL 및 CRUD"
];

// ── 연출 타임라인(초): 글리치 → 블랙홀 개방 → 순차 흡입(스파게티화) → 플레어 → 붕괴 → AI 탄생
const SUCK_BASE_DELAY = 0.3;   // 첫 스킬이 빨려들기 시작하는 시각
const SUCK_STAGGER    = 0.06;  // 스킬 간 흡입 시차
const SUCK_DURATION   = 1.4;   // 스킬 하나가 빨려드는 시간
const LAST_SUCKED_AT  = SUCK_BASE_DELAY + (SKILLS.length - 1) * SUCK_STAGGER + SUCK_DURATION;
const FLASH_AT        = LAST_SUCKED_AT + 0.05; // 마지막 스킬을 삼킨 직후 광자 링 플레어
const AI_BORN_AT      = FLASH_AT + 0.25;       // 블랙홀 붕괴와 함께 AI 탄생
const HOLE_GONE_AT    = AI_BORN_AT + 0.25;

interface Pull { dx: number; dy: number }

export default function PerkSection() {
  const { t } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(false);
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 스킬별 나선 회전량 — 리렌더에도 궤적이 흔들리지 않게 고정
  const spins = useMemo(() => SKILLS.map(() => 280 + Math.random() * 200), []);

  // 발동 순간에 각 스킬 → 블랙홀(컨테이너 중앙)의 실제 벡터를 실측한다.
  // 화면 폭이 얼마든 전부 정확히 특이점 한 점으로 모인다.
  const engage = () => {
    if (isRevealed) return;
    const cont = containerRef.current;
    if (cont) {
      const cr = cont.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      setPulls(SKILLS.map((_, i) => {
        const el = itemRefs.current[i];
        if (!el) return { dx: 0, dy: 0 };
        const r = el.getBoundingClientRect();
        return { dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2) };
      }));
    }
    setIsRevealed(true);
  };

  const itemVariants: Variants = {
    idle: {
      opacity: 1, x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1,
      filter: "blur(0px)", color: "#d1d5db",
    },
    devoured: (c: { pull: Pull; delay: number; spin: number }) => {
      const { dx, dy } = c.pull;
      // 진행 방향에 수직으로 중간점을 밀어 나선(소용돌이) 궤적을 만든다
      const midX = dx * 0.55 - dy * 0.5;
      const midY = dy * 0.55 + dx * 0.5;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      return {
        // 앞 구간(0~0.32)은 중력파 글리치(지지직 + 색수차), 뒤 구간은 나선 낙하
        x: [0, 3, -4, 4, -3, midX, dx],
        y: [0, -1, 1, -1, 1, midY, dy],
        // 낙하 각도에 몸을 맞추며 감아 돈다
        rotate: [0, 0, -1, 1, 0, ang + c.spin * 0.55, ang + c.spin],
        // 조석력 인장 — 당기는 방향으로 국수처럼 늘어나고(스파게티화) 수직으로 얇아진다
        scaleX: [1, 1.02, 0.98, 1.02, 1, 1.9, 2.8],
        scaleY: [1, 1, 1, 1, 1, 0.45, 0.06],
        opacity: [1, 1, 1, 1, 1, 0.95, 0],
        filter: ["blur(0px)", "blur(0px)", "blur(0.6px)", "blur(0px)", "blur(0px)", "blur(1px)", "blur(4px)"],
        // 글리치 색수차 → 강착원반처럼 달아오르며 크림색으로
        color: ["#d1d5db", "#67e8f9", "#fda4af", "#d1d5db", "#ffe0ad", "#ffbe6e", "#fff4e0"],
        transition: {
          duration: SUCK_DURATION,
          delay: c.delay,
          times: [0, 0.07, 0.14, 0.22, 0.32, 0.78, 1],
          ease: [0.5, 0, 0.85, 0.4],
        },
      };
    },
  };

  // 블랙홀 수명 주기: 개방 → 스킬을 삼키는 동안 맥동 → 플레어로 부풀었다가 → 붕괴
  const holeDelay = 0.12;
  const holeDuration = HOLE_GONE_AT - holeDelay;
  const holeT = (at: number) => Math.min(1, Math.max(0, (at - holeDelay) / holeDuration));

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="py-4">
          <h2 className="text-xl font-bold text-white">{t.perk.strengthsTitle}</h2>
          <p className="mt-2 text-gray-300 whitespace-pre-line">
            {t.perk.strengths.map((s) => `- ${s}`).join("\n")}
          </p>
        </div>
        <div
          className="py-6 cursor-pointer relative group"
          onMouseEnter={engage}
          onTouchStart={engage}
          onClick={engage}
        >
          <h2 className="text-xl font-bold text-white mb-4 transition-colors duration-300">{t.perk.stackTitle}</h2>

          {/* 스킬 목록 + 블랙홀 무대 */}
          <div ref={containerRef} className="relative min-h-[400px]">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill}
                ref={(el) => { itemRefs.current[index] = el; }}
                className="w-fit text-lg font-medium origin-center mb-1 will-change-transform"
                custom={{
                  pull: pulls?.[index] ?? { dx: 140, dy: 200 - index * 32 },
                  delay: SUCK_BASE_DELAY + index * SUCK_STAGGER,
                  spin: spins[index],
                }}
                variants={itemVariants}
                initial="idle"
                animate={isRevealed ? "devoured" : "idle"}
              >
                {skill}
              </motion.div>
            ))}

            {/* 특이점 무대 — 블랙홀, 플레어, AI 전부 컨테이너 정중앙에서 태어난다 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {isRevealed && (
                <>
                  {/* 미니 블랙홀: 검은 코어 + 광자 링 글로우 + 역방향으로 도는 강착 스트릭 */}
                  <motion.div
                    className="absolute"
                    initial={{ scale: 0, opacity: 0, rotate: 15 }}
                    animate={{
                      scale: [0, 1.15, 1, 1.06, 1, 1.4, 0],
                      opacity: [0, 1, 1, 1, 1, 1, 0],
                      rotate: 15,
                    }}
                    transition={{
                      duration: holeDuration,
                      delay: holeDelay,
                      times: [0, 0.13, 0.28, 0.55, holeT(FLASH_AT), holeT(FLASH_AT + 0.15), 1],
                      ease: "easeInOut",
                    }}
                  >
                    <div className="w-14 h-14 rounded-full bg-black ring-1 ring-amber-200/80 shadow-[0_0_18px_4px_rgba(255,190,110,0.55),0_0_60px_18px_rgba(232,104,24,0.28)]" />
                    <motion.div
                      className="absolute -inset-2 rounded-full border-t-2 border-amber-300/80"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute -inset-4 rounded-full border-t border-orange-400/50"
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    />
                  </motion.div>

                  {/* 마지막 한 입 직후 — 광자 링 플레어가 화면으로 퍼진다 */}
                  <motion.div
                    className="absolute w-16 h-16 rounded-full border-2 border-amber-100"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 3.6, opacity: [0, 0.9, 0] }}
                    transition={{ delay: FLASH_AT, duration: 0.6, ease: "easeOut" }}
                  />

                  {/* 붕괴한 특이점에서 AI 탄생 */}
                  <motion.p
                    className="absolute text-yellow-400 font-bold text-9xl drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
                    initial={{ opacity: 0, scale: 0.12, rotate: -20, filter: "blur(14px)" }}
                    animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 13, delay: AI_BORN_AT }}
                  >
                    AI
                  </motion.p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
