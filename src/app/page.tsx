"use client";

import { type ReactNode, useState, useEffect, useRef, useCallback, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BottomDock from "@/components/BottomDock";
import { motion, AnimatePresence } from "framer-motion";
import AsciiBackground from "@/components/AsciiBackground";
import { LanguageProvider, useLanguage } from "@/i18n";
import { useBgmPlayer, type VolumeState } from "@/hooks/useBgmPlayer";
import { dispatchRipple } from "@/lib/ascii/events";
import { SECTIONS, SECTION_PANEL_ID, type SectionId } from "@/lib/sections";

// 전부 정적 import다. dynamic(ssr:false)이던 시절엔 프리렌더 HTML의 가시 텍스트가
// 56자(언어 스위처 + 프로필 두 줄 + 탭 이름 다섯)뿐이었고 <a>도 <h2>도 0개였다 —
// 구글이 읽을 본문이 한 글자도 없었다는 뜻이다.
import CompanySection  from "@/components/CompanySection";
import PerkSection     from "@/components/PerkSection";
import ProjectsSection from "@/components/ProjectsSection";
import FounderSection  from "@/components/FounderSection";
import GallerySection  from "@/components/GallerySection";
import ContactFooter   from "@/components/ContactFooter";

const VOLUME_BTN: Record<VolumeState, string> = {
  full: "bg-cyan-900/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
  off:  "bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]",
};

const LONG_PRESS_MS = 600; // globals.css의 .ring-press 시간과 동기

/** 미세 리플 최소 생성 간격(ms) — 멀티터치/연타 폭주로 리플이 쌓여 랙이 생기는 것을 막는다 */
const MINI_RIPPLE_MIN_MS = 160;
/** 터치 후 이 시간(ms) 안에 오는 click은 같은 탭의 합성 click으로 보고 리플을 중복 생성하지 않는다 */
const TOUCH_CLICK_DEDUPE_MS = 700;

/**
 * 재생 실패로 인한 연속 자동 스킵 상한.
 * 한 곡이 404여도 다음 곡으로 넘어가 복구되지만, 서버가 통째로 죽은 상황에서까지
 * 계속 넘기면 리플과 시각 테마 전환이 목록 길이만큼 줄줄이 터진다. 몇 번 시도해도
 * 소리가 안 나면 조용히 멈추는 편이 낫다.
 */
const MAX_TRACK_FAIL_SKIPS = 3;

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

/** 패널 열림/닫힘 연출 시간(초). 탭 전환은 이 연출을 닫힘→열림으로 두 번 태운다 */
const PANEL_ANIM_S = 0.35;
/** 패널 상단 40px 페이드 마스크 — 스크롤된 내용이 화면 위로 녹아 사라지는 액자 */
const PANEL_MASK = "linear-gradient(to bottom, transparent 0px, black 40px)";

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
  const { t } = useLanguage();

  /** 사용자가 고른 탭. null이면 대기 화면 (도크 하이라이트·hero 표시의 기준) */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  /**
   * 패널 안에서 실제로 펼쳐 놓은 섹션.
   * 탭을 바꾸면 selectedIndex가 먼저 바뀌고, 닫힘 연출이 끝난 뒤에야 여기가 따라온다 —
   * 예전 AnimatePresence mode="wait"의 '나갔다 들어오기'를 그대로 재현하기 위함이다.
   * null이면 다섯 섹션이 전부 흐름에 남는다 (= 크롤러가 읽는 상태).
   */
  const [shownIndex, setShownIndex] = useState<number | null>(null);
  /**
   * 섹션별 마운트 세대. 섹션이 실제로 펼쳐지는 순간에만 1 올라가고 그 값이 key로 들어가,
   * 그 섹션 하나만 새 인스턴스로 갈린다. 이유는 둘이다.
   * (1) 예전엔 탭을 닫으면 섹션이 통째로 언마운트돼 다시 열 때 연출이 처음부터 재생됐다
   *     (블랙홀 붕괴, 고래 소나, 갤러리 카테고리 초기화). 항상 마운트로 바꾸면서 그
   *     동작이 사라지는 것을 막는다.
   * (2) 접힌 채(display:none) 마운트된 인스턴스는 캔버스 크기가 0이라 소나 연출이
   *     그냥 흘러가 버린다 — 실제로 펼쳐질 때 새 인스턴스를 줘야 크기를 갖고 시작한다.
   */
  const [mountSeq, setMountSeq] = useState<readonly number[]>(() => SECTIONS.map(() => 0));

  const [viewCount, setViewCount] = useState(-1);
  const [pressing, setPressing]   = useState(false);
  const [hintOn, setHintOn]       = useState(false);

  const {
    audioRef, volumeState, cycleVolume, skipToNextTrack, ensureAudioGraph, resumeIfAutoMuted,
    muteForExternalNav, onTrackEnded,
  } = useBgmPlayer();

  // ── 롱프레스(곡 넘김) / 클릭(볼륨 토글) ───────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * 롱프레스로 곡을 넘긴 뒤 따라오는 click 한 번을 반드시 삼키기 위한 표식.
   * 시간(쿨다운)만으로 거르면 합성 click이 조금 늦게 도착했을 때 그대로 통과해
   * 제스처 한 번이 '곡 넘김 + 음소거 토글'을 동시에 일으킨다. 그래서 시간이 아니라
   * 횟수로 막는다 — handleClick이 정확히 한 번만 소비한다.
   * 버튼 밖에서 손을 떼면 click이 아예 오지 않아 표식이 남는데, 다음 누름이 시작될 때
   * 지워서 그 다음 진짜 클릭까지 삼키지 않게 한다 (버튼 클릭은 항상 누름으로 시작한다).
   */
  const pendingClickSwallow = useRef(false);
  const pressCoords    = useRef({ x: 0, y: 0 });
  /**
   * 이 시각 전까지는 화면 전역 미세 리플을 만들지 않는다 — 롱프레스가 이미 굵은 곡 전환
   * 리플을 쏜 직후라 중복이다. 플래그가 아니라 '시각'인 것이 핵심이다: 어떤 이벤트가
   * 유실돼도 저절로 풀려서, 예전처럼 리플이 영구히 막히는 상태가 성립하지 않는다.
   */
  const cooldownUntil  = useRef(0);
  const discovered     = useRef(false);
  const volumeBtnRef   = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      discovered.current = localStorage.getItem(HINT_STORAGE_KEY) === "1";
    } catch {}
  }, []);

  const handlePressStart = useCallback((clientX: number, clientY: number) => {
    // 새 제스처의 시작 — 앞선 롱프레스가 남긴 표식은 여기서 만료된다.
    // (버튼 밖에서 손을 떼 삼킬 click이 끝내 오지 않은 경우가 이 자리에서 정리된다)
    pendingClickSwallow.current = false;
    pressCoords.current = { x: clientX, y: clientY };
    setPressing(true);
    setHintOn(false);
    longPressTimer.current = setTimeout(() => {
      // 곡을 넘겼으니, 손을 뗄 때 따라올 click 한 번은 무조건 삼킨다
      pendingClickSwallow.current = true;
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
    // 손을 뗐으니 미세 리플 쿨다운만 연장한다 — 삼킬 click 표식은 여기서 건드리지
    // 않는다. 예전엔 '롱프레스 중' 플래그를 handleClick에서만 내려서, 버튼 밖에서 떼면
    // click이 오지 않아 플래그가 영구히 켜진 채 남고 사이트 전역 리플이 통째로 막혔다.
    // 이제 리플을 막는 것은 저절로 만료되는 시각뿐이라 그 상태가 아예 성립하지 않는다.
    if (pendingClickSwallow.current) cooldownUntil.current = Date.now() + 250;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    // 롱프레스 뒤에 따라오는 click은 도착이 얼마나 늦든 한 번은 반드시 삼킨다
    if (pendingClickSwallow.current) {
      pendingClickSwallow.current = false;
      return;
    }
    if (Date.now() < cooldownUntil.current) return; // 곡 전환 직후의 잔여 입력
    // 얇은 리플 발사
    dispatchRipple({ x: pressCoords.current.x, y: pressCoords.current.y, thin: true });
    cycleVolume();
  }, [cycleVolume]);

  // ── 곡 파일이 죽었을 때의 복구 ─────────────────────────────────────
  // 곡 하나가 404거나 디코드에 실패하면 지금까지는 재생이 조용히 영영 멈췄다.
  // 훅의 공개 API(skipToNextTrack)만으로 다음 곡으로 넘겨 복구한다 — 곡 인덱스
  // 전진·시각 테마 전환·페이드가 전부 훅 안에서 한 경로로 처리되기 때문이다.
  /** 연속 재생 실패 횟수 — 목록이 통째로 깨졌을 때 무한 스킵을 막는 카운터 */
  const trackFailStreak = useRef(0);

  const handleTrackPlaying = useCallback(() => {
    trackFailStreak.current = 0; // 한 곡이라도 실제로 소리가 났으면 연속 실패는 리셋
  }, []);

  const handleTrackError = useCallback(() => {
    const audio = audioRef.current;
    // src를 아직 넣지 않은 상태의 스퓨리어스 error는 무시한다
    if (!audio || !audio.src) return;
    const code = audio.error?.code;
    // error 객체 없이 error 이벤트만 날아오는 브라우저가 있다. 그걸 실패로 읽으면
    // 평범한 src 교체 한 번이 스킵 → 또 교체 → 또 스킵으로 번져 리플과 시각 테마가
    // 줄줄이 터진다. 진짜 MediaError가 붙어 있을 때만 실패로 본다.
    if (code === undefined) return;
    // src 교체로 이전 로드가 취소된 것(ABORTED)도 실패가 아니다 — 스킵 연타에서 정상 발생
    if (code === MediaError.MEDIA_ERR_ABORTED) return;
    // 소리가 한 번도 나지 않은 채 연속 실패하면 몇 곡 만에 멈춘다 — 목록이 통째로
    // 깨졌을 때 플레이리스트 전체를 훑으며 스킵하지 않게 하는 상한이다
    if (trackFailStreak.current >= MAX_TRACK_FAIL_SKIPS) return;
    trackFailStreak.current++;
    // 곡 전환 리플은 볼륨 버튼에서 나가게 한다 — 롱프레스 스킵과 같은 자리라
    // 갑자기 화면 한복판에서 터지는 맥락 없는 리플이 되지 않는다
    const rect = volumeBtnRef.current?.getBoundingClientRect();
    skipToNextTrack(
      rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
    );
  }, [audioRef, skipToNextTrack]);

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
    fetch("https://wick-ribbon-player.ngrok-free.dev/pp/viewcount/1", {
      signal: controller.signal,
      // ngrok 무료 도메인의 브라우저 경고 페이지 우회 (값은 아무거나)
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { viewCount?: unknown }) => {
        if (typeof data.viewCount === "number") setViewCount(data.viewCount);
      })
      .catch(() => {
        // 실패는 '0회'가 아니라 '모름'이다 — -1 센티널을 그대로 둬서 표시 자체를
        // 하지 않는다. 예전엔 여기서 0을 넣어 일시적 실패에 "Total 0 views"가 떴다.
      });
    return () => controller.abort();
  }, []);

  // ── 화면 아무 곳 클릭/터치 시 미세 리플 + 재생 동의 ────────────────
  const lastMiniRippleAt = useRef(0);
  const lastTouch        = useRef({ t: 0, x: 0, y: 0 });

  useEffect(() => {
    // 리플 생성만 빈도 제한한다 — 오디오 그래프/재생 동의 처리는 매번 그대로 수행
    const fireMiniRipple = (x: number, y: number) => {
      // 곡 전환 리플 직후의 중복만 막는다. 조건이 '시각' 하나뿐이라 이벤트가 유실돼도
      // 저절로 풀린다 — 리플이 영구히 막히는 상태 자체를 없앤 것이 요점이다.
      if (Date.now() < cooldownUntil.current) return;
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
  const panelRef          = useRef<HTMLElement>(null);
  const restoreFocus      = useRef(false);
  const prevSelectedIndex = useRef<number | null>(null);

  /**
   * 패널 안에 펼칠 섹션을 갈아끼운다(null이면 접는다). 펼쳐지는 섹션만 새 세대로 마운트된다.
   * shownIndex를 쓰는 유일한 통로라 ref 사본이 항상 정확하다 — 이 사본으로 멱등성을
   * 보장한다: 패널 상태 전이가 onAnimationComplete에 걸려 있어, 콜백이 한 번 더 오더라도
   * 같은 섹션을 두 번 리마운트해서는 안 된다.
   */
  const shownIndexRef = useRef<number | null>(null);
  const revealSection = useCallback((index: number | null) => {
    if (shownIndexRef.current === index) return;
    shownIndexRef.current = index;
    setShownIndex(index);
    if (index === null) return;
    setMountSeq((prev) => prev.map((seq, i) => (i === index ? seq + 1 : seq)));
  }, []);

  const handleSelect = useCallback((index: number) => {
    const next = selectedIndex === index ? null : index;
    setSelectedIndex(next);
    if (next === null) return; // 닫힘 연출이 끝나면 handlePanelSettled가 뒷정리한다
    // 대기 상태였으면 곧바로 펼치고, 다른 탭이 떠 있으면 그 탭의 닫힘 연출을 기다린다
    if (shownIndex === null) revealSection(index);
  }, [revealSection, selectedIndex, shownIndex]);

  // Escape/닫기 버튼으로 닫으면 포커스를 원래 탭 버튼으로 돌려준다 (다이얼로그 관례).
  // 닫기 버튼은 그대로 두면 자신이 사라지며 포커스가 <body>로 떨어진다.
  const closeSection = useCallback(() => {
    restoreFocus.current = prevSelectedIndex.current !== null;
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSection]);

  useEffect(() => {
    if (selectedIndex === null && prevSelectedIndex.current !== null && restoreFocus.current) {
      document
        .querySelector<HTMLButtonElement>(`[data-dock-tab="${prevSelectedIndex.current}"]`)
        ?.focus({ preventScroll: true });
    }
    restoreFocus.current = false;
    prevSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);

  const panelOpen = selectedIndex !== null;
  /** 지금 보여주기로 한 섹션과 사용자가 고른 섹션이 일치할 때만 패널이 열려 있다 */
  const open  = panelOpen && shownIndex === selectedIndex;
  const shown = shownIndex === null ? null : SECTIONS[shownIndex];
  /**
   * 펼쳐 놓은 섹션이 없으면 패널을 display:none으로 접는다 — 이게 '대기 화면'이자
   * 크롤러가 읽는 상태다. 접혀 있어도 DOM에는 다섯 섹션이 전부 남지만 레이아웃·이미지
   * 지연로드 비용은 0이 된다. 별도 상태로 두지 않는 이유: 접힘은 '펼친 섹션이 없다'와
   * 언제나 같은 뜻이라, 상태를 하나 더 두면 둘이 어긋날 길만 열린다.
   */
  const collapsed = shownIndex === null;
  /** 액자(상단 페이드 마스크·연락처·조회수)를 두를지 — 갤러리만 예외 */
  const framed = shown === null ? true : shown.framed;

  // 섹션이 바뀔 때마다 맨 위에서 시작하고, 스크롤 컨테이너에 포커스를 줘서
  // 키보드(방향키/PageDown)로도 스크롤되게 한다.
  useEffect(() => {
    const el = panelRef.current;
    if (shownIndex === null || !el) return;
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
  }, [shownIndex]);

  // 열림/닫힘 연출이 끝난 순간. 닫힘 연출이 끝났다면 기다리던 다음 탭으로 갈아끼워
  // 다시 열고(탭 전환), 기다리는 탭이 없으면 접어서 대기 상태로 되돌린다 — 두 경우가
  // revealSection 한 번으로 표현된다(selectedIndex가 null이면 그게 곧 '접기'다).
  const handlePanelSettled = useCallback(() => {
    if (open) return;
    revealSection(selectedIndex);
  }, [open, revealSection, selectedIndex]);

  // 섹션 요소는 id로 매핑한다 — '갤러리는 5번째'처럼 위치에 사실을 인코딩하지 않고,
  // id를 빠뜨리면 컴파일이 깨진다. 요소를 메모이즈해 HomeInner가 리렌더돼도
  // (볼륨 버튼, 힌트 등) 다섯 섹션 서브트리가 통째로 재조정되지 않게 한다.
  // 언어 전환은 컨텍스트라 그대로 전파된다.
  const sectionNodes = useMemo<Record<SectionId, ReactNode>>(() => ({
    company:  <CompanySection />,
    services: <ProjectsSection onExternalNav={muteForExternalNav} />,
    perk:     <PerkSection />,
    founder:  <FounderSection />,
    gallery:  <GallerySection />,
  }), [muteForExternalNav]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-screen-dvh overflow-hidden text-white"
    >
      <AsciiBackground />

      <audio ref={audioRef} onEnded={onTrackEnded} onError={handleTrackError} onPlaying={handleTrackPlaying} />

      <LanguageSwitcher />

      {/* 볼륨 버튼: 클릭=음소거 토글, 롱프레스=다음 곡 (링이 차오르면 발동) */}
      <motion.button
        ref={volumeBtnRef}
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
        // 키보드 활성화(Enter/Space)는 누름 없이 click만 온다 — 앞선 롱프레스가 남긴
        // 표식을 여기서 지워, 삼켜야 할 합성 click이 아닌 진짜 조작이 먹히지 않는 일을 막는다
        onKeyDown={() => { pendingClickSwallow.current = false; }}
        onContextMenu={(e) => e.preventDefault()}
        // TODO(i18n): 로케일에 a11y 네임스페이스가 생기면 t.a11y.volumeButton으로 교체
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

        {/*
          섹션 패널.
          예전엔 탭을 눌러야 섹션이 마운트됐고, 그래서 프리렌더 HTML에 본문이 한 글자도
          담기지 않았다(가시 텍스트 56자, <a> 0개, <h2> 0개). 이제 다섯 섹션이 항상
          DOM에 있고 — 탭/아코디언과 같은 형태라 모바일 우선 색인에서 정상 색인된다 —
          닫혀 있는 동안엔 display:none으로 통째로 접혀 레이아웃·이미지 지연로드 비용이
          0이 된다.

          연출은 패널 하나를 왕복시켜 예전과 동일하게 유지한다. 탭을 바꾸면 shownIndex가
          곧바로 따라오지 않고 닫힘 연출이 끝난 뒤 교체되므로, AnimatePresence
          mode="wait"의 '나갔다 들어오기'가 그대로 재현된다.
        */}
        <motion.section
          ref={panelRef}
          id={SECTION_PANEL_ID}
          // <section>에 접근명을 주면 그 자체로 region 랜드마크다 — role은 중복이라 넣지 않는다.
          // 열려 있을 때의 이름은 그 탭의 라벨이다(기존 번역 재사용).
          aria-label={shownIndex === null ? undefined : t.tabs[shownIndex]}
          tabIndex={-1}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : 28 }}
          transition={{ duration: PANEL_ANIM_S, ease: "easeInOut" }}
          onAnimationComplete={handlePanelSettled}
          className={`fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-[#0a0a0a]/45 focus:outline-none ${
            collapsed ? "hidden" : ""
          } ${open ? "" : "pointer-events-none"}`}
          // 패널이 살아남으므로 액자를 뗄 땐(갤러리) 속성을 지우는 대신 none으로 덮어쓴다
          // — 예전엔 탭마다 패널이 새로 마운트돼 이 문제가 없었다
          style={{
            maskImage:       framed ? PANEL_MASK : "none",
            WebkitMaskImage: framed ? PANEL_MASK : "none",
          }}
        >
          <div className="min-h-full pt-16 pb-[calc(7rem+env(safe-area-inset-bottom))]">
            {SECTIONS.map((section, index) => (
              // 접혀 있을 때(대기 화면)는 다섯 섹션이 전부 흐름에 남는다 — 프리렌더
              // HTML과 크롤러가 보는 DOM이 바로 이 상태다. 펼쳐져 있으면 고른 섹션
              // 하나만 남기고 나머지는 hidden으로 접근성 트리에서도 빼낸다.
              <div
                key={`${section.id}-${mountSeq[index]}`}
                hidden={!collapsed && index !== shownIndex}
              >
                {sectionNodes[section.id]}
              </div>
            ))}
            {/* 연락처·조회수는 예전과 똑같이 '섹션이 실제로 열려 있고 액자가 있을 때'만
                렌더한다 — 대기 상태까지 넣으면 전화번호가 정적 HTML에 새로 노출된다 */}
            {shown !== null && framed && <ContactFooter />}
            {shown !== null && framed && viewCount !== -1 && (
              <div className="w-full py-4 text-center">
                <p className="text-gray-400 text-sm">Total {viewCount} views</p>
              </div>
            )}
          </div>
        </motion.section>
      </main>

      {/* 패널 닫기 버튼 */}
      <AnimatePresence>
        {panelOpen && (
          <motion.button
            key="close"
            onClick={closeSection}
            // TODO(i18n): 로케일에 a11y 네임스페이스가 생기면 t.a11y.closeSection으로 교체
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
