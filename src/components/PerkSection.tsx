"use client";

import { useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/i18n";

const SKILLS = [
  "C", "C#", "Java", "Dart", "React", "Flutter",
  "Next.js", "Python", "Node.js", "JavaScript",
  "TypeScript", "Firebase Auth", "DB의 SQL 및 CRUD"
];

// ── 8비트 연출 타임라인(초): 피격 플래시 → 픽셀 워프 흡입 → 충격파 → 홀 붕괴 → AI 탄생
// 모든 애니메이션이 유한하다 — 연출이 끝나면 정적 요소만 남아 프레임 비용이 0이 된다.
const SUCK_BASE_DELAY = 0.3;   // 첫 스킬이 빨려들기 시작하는 시각
const SUCK_STAGGER    = 0.07;  // 스킬 간 흡입 시차
const SUCK_DURATION   = 0.85;  // 스킬 하나가 빨려드는 시간
const LAST_SUCKED_AT  = SUCK_BASE_DELAY + (SKILLS.length - 1) * SUCK_STAGGER + SUCK_DURATION;
const FLASH_AT        = LAST_SUCKED_AT + 0.02; // 마지막 스킬을 삼킨 직후 8비트 충격파
const AI_BORN_AT      = FLASH_AT + 0.32;       // 홀 붕괴와 함께 AI 탄생
const HOLE_GONE_AT    = AI_BORN_AT + 0.22;

/** 8비트 스텝 이징 — 진행도를 n단계로 양자화한다 (부드러운 보간 대신 픽셀 점프) */
const quantize = (n: number) => (p: number) => (p >= 1 ? 1 : Math.floor(p * n) / n);
/** 세그먼트가 끝나는 순간 값이 한 번에 바뀌는 스냅 이징 (키프레임 사이를 보간하지 않는다) */
const snap = (p: number) => (p >= 1 ? 1 : 0);

interface Pull { dx: number; dy: number }

export default function PerkSection() {
  const { t } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(false);
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // 스킬 흡입: 흰색 피격 플래시 → 5단계 픽셀 점프로 홀까지 워프하며 계단식으로 작아진다.
  // transform(x/y/scale)과 opacity만 연속 애니메이션(컴포지터 처리)하고, blur·글로우는 쓰지 않는다.
  // 색은 스냅 이징이라 총 3번만 바뀐다 (매 프레임 리페인트 없음).
  const itemVariants: Variants = {
    idle: { opacity: 1, x: 0, y: 0, scale: 1, color: "#d1d5db" },
    devoured: (c: { pull: Pull; delay: number }) => ({
      x: [0, c.pull.dx],
      y: [0, c.pull.dy],
      scale: [1, 0.1],
      opacity: [1, 0, 0],
      color: ["#d1d5db", "#ffffff", "#ffe066", "#ff8a4d"],
      transition: {
        x: { delay: c.delay, duration: SUCK_DURATION, ease: quantize(5) },
        y: { delay: c.delay, duration: SUCK_DURATION, ease: quantize(5) },
        scale: { delay: c.delay, duration: SUCK_DURATION, ease: quantize(5) },
        // 주의: opacity는 WAAPI 가속이라 단일 이징이 전체 구간에 걸린다 —
        // 세그먼트별 스냅이 되도록 반드시 '배열'로 준다. snap은 세그먼트 끝에서
        // 발화하므로 1→0 세그먼트가 0.9에서 끝나게 값을 한 칸 앞당겼다(90%에 소멸).
        opacity: { delay: c.delay, duration: SUCK_DURATION, times: [0, 0.9, 1], ease: [snap, snap] },
        color: { delay: c.delay, duration: SUCK_DURATION, times: [0, 0.12, 0.5, 0.8], ease: [snap, snap, snap] },
      },
    }),
  };

  const holeT = (at: number) => at / HOLE_GONE_AT;

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

          {/* 스킬 목록 + 8비트 블랙홀 무대 */}
          <div ref={containerRef} className="relative min-h-[400px]">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill}
                ref={(el) => { itemRefs.current[index] = el; }}
                className="w-fit text-lg font-medium mb-1"
                custom={{
                  pull: pulls?.[index] ?? { dx: 140, dy: 200 - index * 32 },
                  delay: SUCK_BASE_DELAY + index * SUCK_STAGGER,
                }}
                variants={itemVariants}
                initial="idle"
                animate={isRevealed ? "devoured" : "idle"}
              >
                {skill}
              </motion.div>
            ))}

            {/* 특이점 무대 — 전부 컨테이너 정중앙에서 벌어진다 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {isRevealed && (
                <>
                  {/* CRT 스캔라인 — 정적 그라디언트라 유지 비용이 없다 */}
                  <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 4px)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.15, ease: snap }}
                  />

                  {/* 8비트 블랙홀: 각진 검은 코어 + 두꺼운 픽셀 테두리 + 하드 오프셋 그림자 */}
                  <motion.div
                    className="absolute"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 0, 1, 1, 1.15, 0.5, 0],
                      opacity: [0, 0, 1, 1, 1, 1, 0],
                    }}
                    transition={{
                      duration: HOLE_GONE_AT,
                      times: [0, 0.04, 0.1, holeT(FLASH_AT), holeT(FLASH_AT + 0.08), holeT(AI_BORN_AT), 1],
                      // WAAPI 가속되는 opacity에도 세그먼트별 스냅이 걸리도록 배열로 준다
                      ease: Array(6).fill(snap),
                    }}
                  >
                    <div className="w-12 h-12 bg-black border-4 border-yellow-400 shadow-[6px_6px_0_rgba(202,138,4,0.35)]" />
                    {/* 공전 픽셀 — 45°씩 점프하는 궤도. 유한 회전이라 연출 후 완전히 멈춘다 */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 1080 }}
                      transition={{ delay: 0.15, duration: 2.2, ease: quantize(24) }}
                    >
                      <span className="absolute -top-2.5 left-1/2 -ml-1 w-2 h-2 bg-amber-300" />
                    </motion.div>
                  </motion.div>

                  {/* 8비트 충격파: 각진 사각 링 두 개가 계단식으로 퍼진다.
                      keyframes[0]은 딜레이 동안에도 렌더되므로 반드시 초기 상태(투명)로 시작하고,
                      scale/opacity의 타이밍을 분리해 마지막 3.2 스텝도 보이게 한다 */}
                  {[0, 0.1].map((d) => (
                    <motion.span
                      key={d}
                      aria-hidden
                      className="absolute w-14 h-14 border-2 border-yellow-300"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 0.8, 1.6, 2.4, 3.2], opacity: [0, 1, 0.8, 0.5, 0] }}
                      transition={{
                        scale: { delay: FLASH_AT + d, duration: 0.42, times: [0, 0.02, 0.3, 0.55, 0.8], ease: [snap, snap, snap, snap] },
                        opacity: { delay: FLASH_AT + d, duration: 0.42, times: [0, 0.02, 0.34, 0.67, 1], ease: [snap, snap, snap, snap] },
                      }}
                    />
                  ))}

                  {/* 붕괴한 특이점에서 AI 탄생: 계단식 확대 + 클래식 블링크.
                      글로우는 filter 대신 하드 오프셋 text-shadow (정적, 저렴) */}
                  <motion.p
                    className="absolute font-mono font-bold text-9xl tracking-tight text-yellow-400"
                    style={{ textShadow: "6px 6px 0 rgba(202,138,4,0.85)" }}
                    initial={{ opacity: 0, scale: 0.25 }}
                    // keyframes[0]은 딜레이 동안에도 렌더되므로 투명(0)으로 시작해
                    // 큐 시점(2%)에 켜진다. 이징은 세그먼트별 스냅 배열 (WAAPI 대응).
                    animate={{
                      scale: [0.25, 0.25, 0.5, 1, 1, 1, 1, 1],
                      opacity: [0, 1, 1, 1, 0, 1, 0, 1],
                    }}
                    transition={{
                      delay: AI_BORN_AT,
                      duration: 0.72,
                      times: [0, 0.02, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
                      ease: [snap, snap, snap, snap, snap, snap, snap],
                    }}
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
