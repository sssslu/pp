"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BottomDock from "@/components/BottomDock";
import { motion, AnimatePresence } from "framer-motion";
import AsciiBackground from "@/components/AsciiBackground";
import { LanguageProvider } from "@/i18n";
import { useBgmPlayer, type VolumeState } from "@/hooks/useBgmPlayer";
import { dispatchRipple } from "@/lib/ascii/events";

const AboutSection    = dynamic(() => import("@/components/AboutSection"),    { ssr: false });
const GallerySection  = dynamic(() => import("@/components/GallerySection"),  { ssr: false });
const HobbySection    = dynamic(() => import("@/components/HobbySection"),    { ssr: false });
const PerkSection     = dynamic(() => import("@/components/PerkSection"),     { ssr: false });
const ProjectsSection = dynamic(() => import("@/components/ProjectsSection"), { ssr: false });
const ContactFooter   = dynamic(() => import("@/components/ContactFooter"),   { ssr: false });

const VOLUME_BTN: Record<VolumeState, string> = {
  full: "bg-cyan-900/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
  off:  "bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]",
};

const LONG_PRESS_MS = 600; // globals.css의 .ring-press 시간과 동기

/** 미세 리플 최소 생성 간격(ms) — 멀티터치/연타 폭주로 리플이 쌓여 랙이 생기는 것을 막는다 */
const MINI_RIPPLE_MIN_MS = 160;
/** 터치 후 이 시간(ms) 안에 오는 click은 같은 탭의 합성 click으로 보고 리플을 중복 생성하지 않는다 */
const TOUCH_CLICK_DEDUPE_MS = 700;

// 롱프레스(곡 넘김) 발견 유도: 유령 손가락이 버튼을 꾹 누르는 시연 —
// 버튼이 눌리며 실제 롱프레스와 같은 링이 노랗게 차오르고, 완성되는 순간
// "LONG PRESS!" 라벨이 튀어나온다. 음악이 실제로 나오는 중일 때만 보여주고,
// 한 번이라도 롱프레스하면 이후로 안 뜬다.
const HINT_FIRST_MS    = 5000;  // 첫 확인까지 (실질 타이밍은 재생 시간 게이트가 결정)
const HINT_INTERVAL_MS = 22000; // 시연 후 다음 시연까지
const HINT_RETRY_MS    = 2000;  // 재생 조건 미충족 시 재확인 간격
const HINT_DURATION_MS = 3300;  // 시연 전체 길이 (누름 → 링 채움 → 라벨 → 페이드)
const HINT_MIN_PLAY_S  = 6;     // 한 곡을 이만큼(초) 들어야 시연 시작
const HINT_MAX_SHOWS   = 6;     // 세션당 시연 상한 — 발견 못 해도 이 이상 조르지 않는다
const HINT_STORAGE_KEY = "bgm-longpress-discovered";

// ── 아이콘 ────────────────────────────────────────────────────────────

function MusicOnIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
      className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,1)] animate-pulse">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function MusicOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
      className="w-6 h-6 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,1)]">
      {/* speaker-x-mark: 스피커 바디 + X 표시 (Heroicons v2 outline) */}
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────

export default function Home() {
  return (
    <LanguageProvider>
      <HomeInner />
    </LanguageProvider>
  );
}

function HomeInner() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewCount, setViewCount]         = useState(-1);
  const [pressing, setPressing]           = useState(false);
  const [hintOn, setHintOn]               = useState(false);

  const {
    audioRef, volumeState, cycleVolume, skipToNextTrack, ensureAudioGraph, resumeIfAutoMuted,
    muteForExternalNav, onTrackEnded,
  } = useBgmPlayer();

  // ── 롱프레스(곡 넘김) / 클릭(볼륨 토글) ───────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress    = useRef(false);
  const pressCoords    = useRef({ x: 0, y: 0 });
  const cooldownUntil  = useRef(0);
  const discovered     = useRef(false);

  useEffect(() => {
    try {
      discovered.current = localStorage.getItem(HINT_STORAGE_KEY) === "1";
    } catch {}
  }, []);

  const handlePressStart = useCallback((clientX: number, clientY: number) => {
    isLongPress.current = false;
    pressCoords.current = { x: clientX, y: clientY };
    setPressing(true);
    setHintOn(false);
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      cooldownUntil.current = Date.now() + 200;
      // 사용자가 롱프레스를 발견했으니 힌트는 그만 보여준다
      discovered.current = true;
      try { localStorage.setItem(HINT_STORAGE_KEY, "1"); } catch {}
      ensureAudioGraph();
      skipToNextTrack(clientX, clientY);
    }, LONG_PRESS_MS);
  }, [ensureAudioGraph, skipToNextTrack]);

  const handlePressEnd = useCallback(() => {
    setPressing(false);
    if (isLongPress.current) cooldownUntil.current = Date.now() + 250;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isLongPress.current || Date.now() < cooldownUntil.current) {
      isLongPress.current = false;
      return; // 롱프레스였거나 쿨다운 중이면 무시
    }
    // 얇은 리플 발사
    dispatchRipple({ x: pressCoords.current.x, y: pressCoords.current.y, thin: true });
    cycleVolume();
  }, [cycleVolume]);

  // ── 롱프레스 유도 시연 ──────────────────────────────────────────────
  // 음악이 실제로 나오는 중이고(음소거·정지면 무의미) 한 곡을 어느 정도 들었을 때만,
  // 버튼이 스스로 눌리는 시연을 보여준다. 발견(실제 롱프레스)하면 영구히 그만두고,
  // 발견하지 못해도 세션당 HINT_MAX_SHOWS번까지만 조른다.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let shown = 0;
    let loopTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = (): number | null => {
      if (discovered.current || shown >= HINT_MAX_SHOWS) return null; // 시연 종료
      if (document.hidden) return HINT_INTERVAL_MS;
      const audio = audioRef.current;
      // 음악이 실제로 재생 중일 때만 — paused는 음소거/차단/로드 전 모두 커버한다
      if (!audio || audio.paused || audio.currentTime < HINT_MIN_PLAY_S) return HINT_RETRY_MS;
      shown++;
      setHintOn(true);
      hideTimer = setTimeout(() => setHintOn(false), HINT_DURATION_MS);
      return HINT_INTERVAL_MS;
    };

    const run = () => {
      const next = tick();
      if (next !== null) loopTimer = setTimeout(run, next);
    };
    loopTimer = setTimeout(run, HINT_FIRST_MS);

    return () => {
      clearTimeout(loopTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [audioRef]);

  // ── 조회수 ────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://slusphere.fly.dev/viewcount/1", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setViewCount(data.viewCount))
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) setViewCount(0);
      });
    return () => controller.abort();
  }, []);

  // ── 화면 아무 곳 클릭/터치 시 미세 리플 + 재생 동의 ────────────────
  const lastMiniRippleAt = useRef(0);
  const lastTouch        = useRef({ t: 0, x: 0, y: 0 });

  useEffect(() => {
    // 리플 생성만 빈도 제한한다 — 오디오 그래프/재생 동의 처리는 매번 그대로 수행
    const fireMiniRipple = (x: number, y: number) => {
      if (isLongPress.current || Date.now() < cooldownUntil.current) return;
      const now = Date.now();
      if (now - lastMiniRippleAt.current < MINI_RIPPLE_MIN_MS) return;
      lastMiniRippleAt.current = now;
      dispatchRipple({ x, y, band: 15 });
    };
    const onClick = (e: MouseEvent) => {
      ensureAudioGraph();
      // 탭 직후 따라오는 '합성 click'만 걸러낸다 — pointerType이 있으면 그것으로,
      // 없으면 시간+거리(같은 지점)로 판별한다. 터치 후 다른 위치의 진짜 마우스
      // 클릭(터치스크린 노트북)까지 억제하면 안 되기 때문.
      const pointerType = (e as PointerEvent).pointerType;
      const fromTouch = pointerType
        ? pointerType === "touch"
        : Date.now() - lastTouch.current.t <= TOUCH_CLICK_DEDUPE_MS &&
          Math.hypot(e.clientX - lastTouch.current.x, e.clientY - lastTouch.current.y) < 30;
      if (!fromTouch) fireMiniRipple(e.clientX, e.clientY);
      // 화면을 한 번이라도 터치(클릭)하면 재생 동의로 간주 — 자동재생 차단으로
      // 꺼져 있었다면 켠다. 볼륨 버튼의 onClick(음소거 토글)이 window보다 먼저
      // 처리되므로, 버튼으로 방금 껐거나 켠 상태를 이 리스너가 뒤집지 않는다.
      resumeIfAutoMuted();
    };
    const onTouch = (e: TouchEvent) => {
      ensureAudioGraph();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastTouch.current = { t: Date.now(), x: touch.clientX, y: touch.clientY };
        fireMiniRipple(touch.clientX, touch.clientY);
      }
    };
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [ensureAudioGraph, resumeIfAutoMuted]);

  // ── 섹션 선택 / 닫기 ─────────────────────────────────────────────
  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  // Escape(키보드)로 닫으면 포커스를 원래 탭 버튼으로 돌려준다 (다이얼로그 관례)
  const closedViaKeyboard = useRef(false);
  const prevSelectedIndex = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closedViaKeyboard.current = true;
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (selectedIndex === null && prevSelectedIndex.current !== null && closedViaKeyboard.current) {
      document
        .querySelector<HTMLButtonElement>(`[data-dock-tab="${prevSelectedIndex.current}"]`)
        ?.focus({ preventScroll: true });
    }
    closedViaKeyboard.current = false;
    prevSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);

  const panelOpen    = selectedIndex !== null;
  const isGalleryTab = selectedIndex === 4;

  // 패널이 열리면 스크롤 컨테이너에 포커스를 줘서 키보드(방향키/PageDown)로도 스크롤되게 한다
  const focusPanel = useCallback((el: HTMLElement | null) => {
    el?.focus({ preventScroll: true });
  }, []);

  // 요소를 메모이즈해 HomeInner가 리렌더돼도(볼륨 버튼, 힌트 등) 열린 섹션의
  // 서브트리 전체가 재조정되지 않게 한다. 언어 전환은 컨텍스트라 그대로 전파된다.
  const pages = useMemo(() => [
    <AboutSection    key="about"    />,
    <PerkSection     key="perk"     />,
    <ProjectsSection key="projects" onExternalNav={muteForExternalNav} />,
    <HobbySection    key="hobby"    />,
    <GallerySection  key="gallery"  />,
  ], [muteForExternalNav]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-screen-dvh overflow-hidden text-white"
    >
      <AsciiBackground />

      <audio ref={audioRef} onEnded={onTrackEnded} />

      <LanguageSwitcher />

      {/* 볼륨 버튼: 클릭=음소거 토글, 롱프레스=다음 곡 (링이 차오르면 발동) */}
      <motion.button
        onClick={handleClick}
        onMouseDown={(e) => {
          if (e.button === 0) handlePressStart(e.clientX, e.clientY);
        }}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePressStart(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Cycle volume (hold to skip track)"
        // 시연 중엔 유령 손가락이 누르는 것처럼 살짝 눌렸다가, 링이 완성되면 톡 튀어오른다
        animate={
          pressing
            ? { scale: 0.88 }
            : hintOn
              ? { scale: [1, 0.9, 0.9, 1.07, 1] }
              : { scale: 1 }
        }
        transition={
          !pressing && hintOn
            ? { duration: HINT_DURATION_MS / 1000, times: [0, 0.08, 0.41, 0.47, 0.53], ease: "easeInOut" }
            : { duration: 0.15 }
        }
        className={`fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:right-8 md:bottom-8 z-50 flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-[background-color,border-color,box-shadow] duration-300 backdrop-blur-md select-none touch-none ${VOLUME_BTN[volumeState]}`}
      >
        {volumeState === "full" ? <MusicOnIcon /> : <MusicOffIcon />}

        {/* 롱프레스 진행 링: 실제로 꾹 누르는 동안만 차오른다 */}
        {pressing && (
          <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full pointer-events-none">
            <rect
              x="1.5" y="1.5" width="53" height="53" rx="11"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset="100"
              className="ring-press"
            />
          </svg>
        )}

        {/* 발견 유도 시연: 실제 롱프레스와 같은 링이 노랗게 저절로 차오르고,
            완성되는 순간 "LONG PRESS!" 라벨이 튀어나온다 — 버튼이 스스로 사용법을 보여준다 */}
        {hintOn && !pressing && (
          <>
            {/* 유령 진행 링 (.ring-press와 같은 궤적, 호박색) */}
            <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full pointer-events-none">
              <motion.rect
                x="1.5" y="1.5" width="53" height="53" rx="11"
                fill="none"
                stroke="rgba(250,204,21,0.9)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100, opacity: 0 }}
                animate={{ strokeDashoffset: [100, 100, 0, 0], opacity: [0, 0.9, 0.9, 0] }}
                transition={{ duration: HINT_DURATION_MS / 1000, times: [0, 0.08, 0.41, 0.55], ease: "easeInOut" }}
              />
            </svg>
            {/* 링이 차오르는 동안의 은은한 호박색 글로우 */}
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ boxShadow: "0 0 16px 3px rgba(250,204,21,0.45), inset 0 0 10px rgba(250,204,21,0.2)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: HINT_DURATION_MS / 1000, times: [0, 0.1, 0.45, 0.6], ease: "easeInOut" }}
            />
            {/* 링 완성 순간 튀어나오는 라벨: 뭘 하면(LONG PRESS) 뭐가 되는지(NEXT BGM) */}
            <motion.span
              aria-hidden
              className="absolute bottom-full right-0 mb-2 flex flex-col items-end gap-0.5 pointer-events-none select-none"
              initial={{ opacity: 0, y: 6, scale: 0.7 }}
              animate={{
                opacity: [0, 0, 1, 1, 0],
                y: [6, 6, 0, 0, -4],
                scale: [0.7, 0.7, 1, 1, 0.96],
              }}
              transition={{ duration: HINT_DURATION_MS / 1000, times: [0, 0.4, 0.47, 0.88, 1], ease: "easeOut" }}
            >
              <span className="whitespace-nowrap text-[12px] font-bold tracking-[0.2em] text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.85)]">
                LONG PRESS!
              </span>
              <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.15em] text-yellow-200/80">
                ⏭ NEXT BGM
              </span>
            </motion.span>
          </>
        )}
      </motion.button>

      <main className="text-glow h-full">
        {/* 상단 프로필: 패널이 열리면 비켜준다 */}
        <AnimatePresence initial={false}>
          {!panelOpen && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              // 캔버스(z-0)가 static 콘텐츠보다 위에 그려지므로 명시적으로 띄운다
              // — 블랙홀처럼 불투명한 장면에서도 프로필 타이틀이 보여야 한다
              className="relative z-10"
            >
              <HeroSection />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 섹션 패널: 탭 선택 시에만 화면을 덮는 스크롤 영역 */}
        <AnimatePresence mode="wait">
          {panelOpen && (
            <motion.section
              key={selectedIndex}
              ref={focusPanel}
              tabIndex={-1}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-[#0a0a0a]/45 focus:outline-none"
              style={isGalleryTab ? undefined : {
                maskImage:       "linear-gradient(to bottom, transparent 0px, black 40px)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 40px)",
              }}
            >
              <div className="min-h-full pt-16 pb-[calc(7rem+env(safe-area-inset-bottom))]">
                {pages[selectedIndex]}
                {!isGalleryTab && <ContactFooter />}
                {!isGalleryTab && viewCount !== -1 && (
                  <div className="w-full py-4 text-center">
                    <p className="text-gray-400 text-sm">Total {viewCount} views</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* 패널 닫기 버튼 */}
      <AnimatePresence>
        {panelOpen && (
          <motion.button
            key="close"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close section"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-4 z-40 flex items-center justify-center w-10 h-10 rounded-2xl border border-gray-700/60 bg-gray-950/70 backdrop-blur-xl text-gray-300 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <BottomDock selectedIndex={selectedIndex} onSelect={handleSelect} />

      {/* 대기 화면 한 켠의 조회수 (좌상단 — 하단 도크와 겹치지 않는다) */}
      {!panelOpen && viewCount !== -1 && (
        <div className="fixed top-5 left-4 z-10 text-[11px] text-gray-500/80 select-none pointer-events-none">
          Total {viewCount} views
        </div>
      )}
    </motion.div>
  );
}
