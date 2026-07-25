"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { useLanguage } from "@/i18n";

// 고유명사 12개는 번역이 없으니 컴포넌트 상수로 둔다.
// 유일하게 번역이 필요한 DB 항목만 로케일(t.perk.dbSkill)에서 받아 뒤에 붙인다 —
// 예전엔 한국어 문자열이 이 배열에 섞여 있어 영어 화면에 한 줄만 한글로 남았다.
const SKILLS = [
  "C", "C#", "Java", "Dart", "React", "Flutter",
  "Next.js", "Python", "Node.js", "JavaScript",
  "TypeScript", "Firebase Auth"
];
const SKILL_COUNT = SKILLS.length + 1; // + 로케일에서 오는 DB 항목

/** 스택이 눈앞에 머문 시간이 이만큼 쌓이면 저절로 삼켜진다 */
const READ_MS = 4000;

// ── 8비트 연출 타임라인(초): 피격 플래시 → 픽셀 워프 흡입 → 충격파 → 홀 붕괴 → AI 탄생
// 모든 애니메이션이 유한하다 — 연출이 끝나면 정적 요소만 남아 프레임 비용이 0이 된다.
const SUCK_BASE_DELAY = 0.3;   // 첫 스킬이 빨려들기 시작하는 시각
const SUCK_STAGGER    = 0.07;  // 스킬 간 흡입 시차
const SUCK_DURATION   = 0.85;  // 스킬 하나가 빨려드는 시간
const LAST_SUCKED_AT  = SUCK_BASE_DELAY + (SKILL_COUNT - 1) * SUCK_STAGGER + SUCK_DURATION;
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
  const reduced = useReducedMotion();
  const [isRevealed, setIsRevealed] = useState(false);
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 키보드 트리거의 접근성 이름을 h2에서 빌려온다 — 새 문구를 만들지 않기 위해서다.
  const stackTitleId = useId();

  const skills = [...SKILLS, t.perk.dbSkill];

  // 발동 순간에 각 스킬 → 블랙홀(컨테이너 중앙)의 실제 벡터를 실측한다.
  // 화면 폭이 얼마든 전부 정확히 특이점 한 점으로 모인다.
  const engage = () => {
    if (isRevealed) return;
    const cont = containerRef.current;
    if (cont) {
      const cr = cont.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      setPulls(skills.map((_, i) => {
        const el = itemRefs.current[i];
        if (!el) return { dx: 0, dy: 0 };
        const r = el.getBoundingClientRect();
        return { dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2) };
      }));
    }
    setIsRevealed(true);
  };

  // 아래 타이머가 항상 최신 engage를 부르게 한다 — engage는 매 렌더 새로 만들어지는데
  // 타이머 이펙트는 isRevealed에만 반응해야 하므로(카운트가 리셋되면 안 된다) 직접 못 잡는다.
  const engageRef = useRef(engage);
  useEffect(() => { engageRef.current = engage; });

  // 4초가 지나면 저절로 발동한다 — 발동을 사람 손에 맡기지 않는다.
  // hover냐 tap이냐를 두고 "읽기도 전에 사라진다" 와 "아무도 발동을 못 한다" 사이에서
  // 고르던 문제가 통째로 사라진다. 모두가 4초를 읽고, 그 다음 삼켜진다.
  //
  // 세는 기준이 '마운트'가 아니라 '스택이 실제로 눈앞에 있는 동안'인 이유가 셋 있다.
  //  · 다섯 섹션은 항상 마운트돼 있다(page.tsx의 접힘 패널 — SSR 본문 노출 때문이다).
  //    마운트 시점부터 세면 대기 화면에서 4초가 지나가 버려, 정작 능력치 탭을 연
  //    방문자는 이미 비어 있는 무대를 본다.
  //  · 스택은 강점 아래라 좁은 화면에선 탭을 열어도 처음엔 화면 밖이다. 탭을 여는
  //    순간부터 세면 강점을 읽는 사이에 삼켜진다.
  //  · 브라우저 탭이 백그라운드인 동안 흘러간 4초는 읽은 4초가 아니다.
  // 앞의 둘은 IntersectionObserver가, 나머지는 visibilitychange가 막는다.
  // (모션 감소 설정이어도 4초는 그대로 센다 — 이 4초는 연출이 아니라 읽는 시간이고,
  //  건너뛸 것은 날아가는 과정뿐이다. 그건 itemVariants가 이미 처리한다.)
  useEffect(() => {
    if (isRevealed) return;
    const cont = containerRef.current;
    if (!cont) return;

    let onScreen = false;
    let left = READ_MS;      // 아직 채워야 할 시간
    let startedAt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (timer !== null || !onScreen || document.hidden) return;
      startedAt = Date.now();
      timer = setTimeout(() => {
        timer = null;
        engageRef.current();
      }, left);
    };
    const hold = () => {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      left = Math.max(0, left - (Date.now() - startedAt));
    };

    // threshold: 스택 무대가 어느 정도 들어와야 '읽고 있다'로 친다.
    // 화면 밖으로 나가면 멈추고, 다시 들어오면 남은 시간부터 이어 센다.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) run();
        else hold();
      },
      { threshold: 0.3 },
    );
    io.observe(cont);

    const onVisibility = () => {
      if (document.hidden) hold();
      else run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      hold();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isRevealed]);

  // 스킬 흡입: 흰색 피격 플래시 → 5단계 픽셀 점프로 홀까지 워프하며 계단식으로 작아진다.
  // transform(x/y/scale)과 opacity만 연속 애니메이션(컴포지터 처리)하고, blur·글로우는 쓰지 않는다.
  // 색은 스냅 이징이라 총 3번만 바뀐다 (매 프레임 리페인트 없음).
  //
  // 모션 감소 설정이면 HobbySection과 같은 원칙 — 연출을 끄는 게 아니라 결과로 점프한다.
  // 스택이 사라지고 AI만 남는 결말은 그대로 보되, 날아가는 과정만 생략한다.
  const itemVariants: Variants = {
    idle: { opacity: 1, x: 0, y: 0, scale: 1, color: "#d1d5db" },
    devoured: (c: { pull: Pull; delay: number }) => reduced ? {
      opacity: 0,
      transition: { duration: 0 },
    } : ({
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
        {/* 클릭은 '4초를 안 기다리고 넘긴다'는 뜻으로만 남긴다 — 발동 자체는 위 타이머가 맡는다.
            onMouseEnter는 뺐다: 자동 발동이 생긴 이상 hover는 발동률을 올리는 게 아니라
            읽는 도중 마우스가 스쳤다는 이유로 셋업을 빼앗을 뿐이다.
            onTouchStart도 없다 — 패널이 overflow-y-auto라 스크롤 시작 터치와 구분되지 않는다. */}
        <div
          className="py-6 relative group cursor-pointer"
          onClick={engage}
        >
          <h2 id={stackTitleId} className="text-xl font-bold text-white mb-4 transition-colors duration-300">{t.perk.stackTitle}</h2>

          {/* 스킬 목록 + 8비트 블랙홀 무대. 무대 자체는 의미 없는 div로 둔다 —
              예전엔 여기에 role="button"이 있었는데, role="button"의 자손은 전부
              presentational로 접혀 스크린리더가 13개 스킬을 읽지 못하고 버튼 이름
              하나("C C# Java … DB의 SQL 및 CRUD")로 뭉갰다. 스킬은 평범한 본문이어야 한다. */}
          <div ref={containerRef} className="relative min-h-[400px]">
            {/* 키보드 전용 발동 트리거 — 목록을 감싸지 않는 형제 요소다.
                · pointer-events-none: 마우스 경로(hover/click)는 바깥 div가 그대로 담당하고,
                  이 요소는 히트 테스트에서 빠진다. 포커스는 포인터 이벤트와 무관하므로
                  Tab으로는 여전히 도달한다. 포커스 링이 무대 전체를 감싸 발동 범위를 보여준다.
                · 네이티브 <button>을 쓰지 않은 이유: 네이티브 버튼은 연출이 끝나 더 할 일이
                  없어도 Space를 무조건 삼킨다. 패널이 스크롤 컨테이너라 그 순간 Space
                  페이지 넘김이 죽는다. 여기선 아직 발동 가능할 때(!isRevealed)만 가로챈다.
                · 발동 후엔 tabIndex -1로 탭 순서에서만 빠진다. 지우거나 disabled로 만들면
                  Enter로 방금 발동한 사용자의 포커스가 body로 튕겨 나간다. */}
            <div
              role="button"
              aria-labelledby={stackTitleId}
              aria-disabled={isRevealed}
              tabIndex={isRevealed ? -1 : 0}
              onKeyDown={(e) => {
                if (isRevealed) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  engage();
                }
              }}
              className="absolute inset-0 pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            />

            {skills.map((skill, index) => (
              <motion.div
                // 키는 반드시 index — 마지막 항목만 로케일 문자열(t.perk.dbSkill)이라
                // 문자열을 키로 쓰면 언어 전환 시 그 하나만 리마운트되어, 이미 삼켜진
                // 스킬이 텅 빈 무대에 1.14초간 되살아났다가 다시 빨려든다.
                // 목록은 길이·순서가 고정이므로 index가 안정적인 키다.
                key={index}
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

                  {/* 홀·충격파는 '먹히는 과정'이라 모션 감소 설정에선 통째로 건너뛴다.
                      스캔라인은 연출이 끝나도 남는 정적 화면이라 그대로 둔다. */}
                  {!reduced && <>
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
                  </>}

                  {/* 붕괴한 특이점에서 AI 탄생: 계단식 확대 + 클래식 블링크.
                      글로우는 filter 대신 하드 오프셋 text-shadow (정적, 저렴).
                      모션 감소 설정이면 확대·블링크 없이 결말만 즉시 세운다 */}
                  <motion.p
                    className="absolute font-mono font-bold text-9xl tracking-tight text-yellow-400"
                    style={{ textShadow: "6px 6px 0 rgba(202,138,4,0.85)" }}
                    initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.25 }}
                    // keyframes[0]은 딜레이 동안에도 렌더되므로 투명(0)으로 시작해
                    // 큐 시점(2%)에 켜진다. 이징은 세그먼트별 스냅 배열 (WAAPI 대응).
                    animate={reduced ? { opacity: 1, scale: 1 } : {
                      scale: [0.25, 0.25, 0.5, 1, 1, 1, 1, 1],
                      opacity: [0, 1, 1, 1, 0, 1, 0, 1],
                    }}
                    transition={reduced ? { duration: 0 } : {
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
