"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBubbles from "@/components/FloatingBubbles";
import { LanguageProvider, useLanguage } from "@/i18n";

const AboutSection    = dynamic(() => import("@/components/AboutSection"),    { ssr: false });
const GallerySection  = dynamic(() => import("@/components/GallerySection"),  { ssr: false });
const HobbySection    = dynamic(() => import("@/components/HobbySection"),    { ssr: false });
const PerkSection     = dynamic(() => import("@/components/PerkSection"),     { ssr: false });
const ProjectsSection = dynamic(() => import("@/components/ProjectsSection"), { ssr: false });
const ContactFooter   = dynamic(() => import("@/components/ContactFooter"),   { ssr: false });

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -20 },
} as const;

const VOLUME_BTN: Record<"full" | "half" | "off", string> = {
  full: "bg-cyan-900/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
  half: "bg-yellow-900/20 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]",
  off:  "bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]",
};

const BGM_VISUAL_COLORS: Record<string, string> = {
  bgm1: "#06b6d4",
  bgm2: "#8b5cf6",
  bgm3: "#10b981",
  bgm4: "#ec4899",
  bgm5: "#facc15",
};

type BgmVisualWindow = Window & { __bgmBeatPulse?: number };

// ── 유틸 ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBgmVisualColor(fileName: string): string {
  const key = fileName.toLowerCase().replace(/\.[^.]+$/, "");
  return BGM_VISUAL_COLORS[key] ?? "#06b6d4";
}

function getDifferentTrackIndex(list: string[], currentIndex: number, mode: "random" | "next"): number {
  const currentTrack = list[currentIndex];
  const candidates = list
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => track !== currentTrack);

  if (candidates.length === 0) return currentIndex;

  if (mode === "random") {
    return candidates[Math.floor(Math.random() * candidates.length)].index;
  }

  for (let step = 1; step <= list.length; step++) {
    const nextIndex = (currentIndex + step) % list.length;
    if (list[nextIndex] !== currentTrack) return nextIndex;
  }

  return candidates[0].index;
}

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

function MusicHalfIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
      className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,1)]">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewCount, setViewCount]         = useState(-1);
  const [volumeState, setVolumeState]     = useState<"full" | "half" | "off">("full");

  const audioRef      = useRef<HTMLAudioElement>(null);
  const bgmListRef    = useRef<string[]>([]);
  const bgmIndexRef   = useRef(0);
  // Web Audio API refs — enables volume control on mobile (iOS)
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const gainNodeRef   = useRef<GainNode | null>(null);
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const freqDataRef   = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const visualRafRef  = useRef<number | null>(null);
  const beatFloorRef  = useRef(0.04);
  const beatPeakRef   = useRef(0.18);
  const beatEnvRef    = useRef(0);
  const beatFluxAvgRef = useRef(0);
  const beatFluxDevRef = useRef(0.025);
  const beatBandsRef  = useRef<number[]>([]);
  const beatPulseRef  = useRef(0);
  const lastBeatAtRef = useRef(0);
  const gainValueRef  = useRef(0.3); // desired gain before AudioContext exists
  const volumeStateRef = useRef<"full" | "half" | "off">("full");

  // Long-press refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress    = useRef(false);
  const pressCoords    = useRef({ x: 0, y: 0 });
  const cooldownUntil  = useRef(0);
  const LONG_PRESS_MS  = 600;

  const updateBgmVisualColor = useCallback((fileName: string, transition = false) => {
    const color = getBgmVisualColor(fileName);
    beatFloorRef.current = 0.04;
    beatPeakRef.current = 0.18;
    beatEnvRef.current = 0;
    beatFluxAvgRef.current = 0;
    beatFluxDevRef.current = 0.025;
    beatBandsRef.current = [];
    beatPulseRef.current = 0;
    lastBeatAtRef.current = 0;
    window.dispatchEvent(new CustomEvent("bgm-visual-track", {
      detail: { color, transition },
    }));
    return color;
  }, []);

  const setSyncedVolumeState = useCallback((state: "full" | "half" | "off") => {
    const nextGain = state === "full" ? 0.3 : state === "half" ? 0.15 : 0;
    const audio = audioRef.current;
    const gain = gainNodeRef.current;

    volumeStateRef.current = state;
    gainValueRef.current = nextGain;
    setVolumeState(state);

    if (gain) gain.gain.value = nextGain;
    else if (audio) try { audio.volume = nextGain; } catch (_) {}

    if (state === "off") audio?.pause();
  }, []);

  const startBeatVisualLoop = useCallback(() => {
    if (visualRafRef.current !== null) return;

    const tick = () => {
      const analyser = analyserRef.current;
      const data = freqDataRef.current;
      let pulse = 0;

      if (analyser && data) {
        analyser.getByteFrequencyData(data);

        const audioCtx = audioCtxRef.current;
        const hzPerBin = (audioCtx?.sampleRate ?? 44100) / analyser.fftSize;
        const kickStart = Math.max(1, Math.floor(45 / hzPerBin));
        const kickEnd = Math.min(data.length, Math.ceil(170 / hzPerBin));
        const bassEnd = Math.min(data.length, Math.ceil(340 / hzPerBin));
        const lowEnd = Math.min(data.length, Math.ceil(620 / hzPerBin));

        let kickSum = 0;
        let kickWeight = 0;
        let bassSum = 0;
        let bassCount = 0;
        let fluxSum = 0;
        let fluxWeight = 0;
        const prev = beatBandsRef.current;

        for (let i = kickStart; i < kickEnd; i++) {
          const freq = i * hzPerBin;
          const center = 92;
          const weight = 1.2 + Math.max(0, 1 - Math.abs(freq - center) / 90) * 2.4;
          const value = data[i] / 255;
          kickSum += value * weight;
          kickWeight += weight;
        }

        for (let i = kickEnd; i < bassEnd; i++) {
          bassSum += data[i] / 255;
          bassCount++;
        }

        for (let i = kickStart; i < lowEnd; i++) {
          const value = data[i] / 255;
          const diff = Math.max(0, value - (prev[i] ?? 0));
          const weight = i < kickEnd ? 2.1 : i < bassEnd ? 1.25 : 0.55;
          fluxSum += diff * weight;
          fluxWeight += weight;
          prev[i] = value;
        }

        const kick = kickSum / Math.max(1, kickWeight);
        const bass = bassSum / Math.max(1, bassCount);
        const energy = Math.min(1, Math.pow(kick * 0.78 + bass * 0.22, 0.62) * 1.42);
        const flux = fluxSum / Math.max(1, fluxWeight);

        beatFloorRef.current += (energy - beatFloorRef.current) * 0.006;
        beatPeakRef.current = Math.max(beatPeakRef.current * 0.994, energy, beatFloorRef.current + 0.08);
        const range = Math.max(0.05, beatPeakRef.current - beatFloorRef.current);
        const normalized = Math.max(0, Math.min(1, (energy - beatFloorRef.current) / range));
        beatEnvRef.current += (normalized - beatEnvRef.current) * (normalized > beatEnvRef.current ? 0.68 : 0.12);

        beatFluxAvgRef.current += (flux - beatFluxAvgRef.current) * 0.018;
        beatFluxDevRef.current += (Math.abs(flux - beatFluxAvgRef.current) - beatFluxDevRef.current) * 0.03;
        const onset = Math.max(0, Math.min(1, (flux - beatFluxAvgRef.current - beatFluxDevRef.current * 0.65) / Math.max(0.012, beatFluxDevRef.current * 2.35)));

        const now = performance.now();
        if (onset > 0.42 && now - lastBeatAtRef.current > 115) {
          beatPulseRef.current = Math.max(beatPulseRef.current, Math.min(1, 0.55 + onset * 0.7));
          lastBeatAtRef.current = now;
        }

        const sustained = Math.max(0, (beatEnvRef.current - 0.36) * 1.25);
        beatPulseRef.current = Math.max(beatPulseRef.current * 0.84, sustained, onset * 0.62);
        pulse = Math.min(1, beatPulseRef.current);
      }

      (window as BgmVisualWindow).__bgmBeatPulse = pulse;
      visualRafRef.current = requestAnimationFrame(tick);
    };

    visualRafRef.current = requestAnimationFrame(tick);
  }, []);

  /** Lazily create (or resume) the Web Audio graph on first user interaction. */
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      startBeatVisualLoop();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.32;
    gain.gain.value = volumeStateRef.current === "off" ? 0 : gainValueRef.current;
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);
    // Hand volume control entirely to the gain node
    try { audio.volume = 1; } catch (_) {}
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
    analyserRef.current = analyser;
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    ctx.resume();
    startBeatVisualLoop();
    if (volumeStateRef.current === "off") audio.pause();
  }, [startBeatVisualLoop]);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || bgmListRef.current.length === 0) return;
    const track = bgmListRef.current[index];
    audio.src = `/bgm/${track}`;
    updateBgmVisualColor(track);
    // Set element volume only as fallback before Web Audio is initialised
    try { audio.volume = gainValueRef.current; } catch (_) {}
    audio.play()
      .then(() => {
        if (volumeStateRef.current === "off") audio.pause();
      })
      .catch(() => setSyncedVolumeState("off"));
  }, [setSyncedVolumeState, updateBgmVisualColor]);

  const cycleVolume = useCallback(() => {
    ensureAudioGraph();
    if (volumeState === "full") {
      setSyncedVolumeState("half");
    } else if (volumeState === "half") {
      setSyncedVolumeState("off");
    } else {
      setSyncedVolumeState("full");
      audioRef.current?.play().catch(() => {});
    }
  }, [ensureAudioGraph, setSyncedVolumeState, volumeState]);

  /** 랜덤 다른 곡으로 크로스페이드 전환 */
  const skipToRandomTrack = useCallback((originX: number, originY: number) => {
    const list = bgmListRef.current;
    const next = getDifferentTrackIndex(list, bgmIndexRef.current, "random");
    if (!list.length || list[next] === list[bgmIndexRef.current]) return;
    const nextColor = updateBgmVisualColor(list[next], true);

    // 다음 곡 색의 진한 리플 발사
    window.dispatchEvent(new CustomEvent("ascii-ripple", {
      detail: { x: originX, y: originY, color: nextColor },
    }));

    // 볼륨 페이드아웃 → 곡 교체 → 페이드인
    const gain = gainNodeRef.current;
    const audio = audioRef.current;
    if (!audio) return;

    if (volumeStateRef.current === "off") {
      bgmIndexRef.current = next;
      audio.src = `/bgm/${list[next]}`;
      audio.pause();
      return;
    }

    const savedGain = gainValueRef.current;
    const FADE_MS   = 800;
    const steps     = 20;
    let step        = 0;

    // fade out
    const fadeOut = setInterval(() => {
      step++;
      const v = savedGain * (1 - step / steps);
      if (gain) gain.gain.value = v;
      else try { audio.volume = v; } catch (_) {}
      if (step >= steps) {
        clearInterval(fadeOut);
        // swap track
        bgmIndexRef.current = next;
        audio.src = `/bgm/${list[next]}`;
        updateBgmVisualColor(list[next], true);
        audio.play().catch(() => {});
        // fade in
        let stepIn = 0;
        const fadeIn = setInterval(() => {
          stepIn++;
          const v2 = savedGain * (stepIn / steps);
          if (gain) gain.gain.value = v2;
          else try { audio.volume = v2; } catch (_) {}
          if (stepIn >= steps) {
            clearInterval(fadeIn);
            if (gain) gain.gain.value = savedGain;
            else try { audio.volume = savedGain; } catch (_) {}
          }
        }, FADE_MS / steps);
      }
    }, FADE_MS / steps);
  }, [updateBgmVisualColor]);

  useEffect(() => {
    return () => {
      if (visualRafRef.current !== null) cancelAnimationFrame(visualRafRef.current);
      (window as BgmVisualWindow).__bgmBeatPulse = 0;
    };
  }, []);

  // ── Long-press handlers ───────────────────────────────────────────

  const handlePressStart = useCallback((clientX: number, clientY: number) => {
    isLongPress.current = false;
    pressCoords.current = { x: clientX, y: clientY };
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      cooldownUntil.current = Date.now() + 200;
      ensureAudioGraph();
      skipToRandomTrack(clientX, clientY);
    }, LONG_PRESS_MS);
  }, [ensureAudioGraph, skipToRandomTrack]);

  const handlePressEnd = useCallback(() => {
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
    window.dispatchEvent(new CustomEvent("ascii-ripple", {
      detail: { x: pressCoords.current.x, y: pressCoords.current.y, thin: true },
    }));
    cycleVolume();
  }, [cycleVolume]);

  useEffect(() => {
    fetch("/api/bgm")
      .then((r) => r.json())
      .then(({ files }: { files: string[] }) => {
        if (!files?.length) return;
        bgmListRef.current  = shuffle(files);
        bgmIndexRef.current = 0;
        playTrack(0);
      })
      .catch(() => {});
  }, [playTrack]);

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

  // ── 화면 아무 곳 클릭/터치 시 미세 리플 ──────────────────────────
  useEffect(() => {
    const fireMiniRipple = (x: number, y: number) => {
      if (isLongPress.current || Date.now() < cooldownUntil.current) return;
      ensureAudioGraph();
      window.dispatchEvent(new CustomEvent("ascii-ripple", {
        detail: { x, y, band: 15 },
      }));
    };
    const onClick = (e: MouseEvent) => fireMiniRipple(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) fireMiniRipple(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [ensureAudioGraph]);

  const isGalleryTab = selectedIndex === 4;

  const pages = [
    <AboutSection    key="about"    />,
    <PerkSection     key="perk"     />,
    <ProjectsSection key="projects" />,
    <HobbySection    key="hobby"    />,
    <GallerySection  key="gallery"  />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen text-white"
    >
      <FloatingBubbles />

      <audio
        ref={audioRef}
        onEnded={() => {
          const list = bgmListRef.current;
          if (!list.length) return;
          bgmIndexRef.current = getDifferentTrackIndex(list, bgmIndexRef.current, "next");
          playTrack(bgmIndexRef.current);
        }}
      />

      <LanguageSwitcher />

      <button
        onClick={handleClick}
        onMouseDown={(e) => handlePressStart(e.clientX, e.clientY)}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePressStart(t.clientX, t.clientY);
        }}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Cycle volume"
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-300 backdrop-blur-md select-none ${VOLUME_BTN[volumeState]}`}
      >
        {volumeState === "full" ? <MusicOnIcon /> : volumeState === "half" ? <MusicHalfIcon /> : <MusicOffIcon />}
      </button>

      <main>
        <AnimatePresence initial={false}>
          {!isGalleryTab && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden"
            >
              <HeroSection />
            </motion.div>
          )}
        </AnimatePresence>

        <div data-ascii-mask className="sticky top-0 z-20 bg-transparent h-12 flex justify-evenly items-center">
          {t.tabs.map((label, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button key={index} onClick={() => setSelectedIndex(index)} className="text-center">
                <span className={isSelected ? "text-white font-bold" : "text-gray-400 font-normal"}>
                  {label}
                </span>
                {isSelected && <div className="mt-1 h-[2px] w-5 bg-white mx-auto" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="in"
            exit="out"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full relative z-10"
            style={isGalleryTab ? undefined : {
              maskImage:       "linear-gradient(to bottom, transparent 0px, black 30px)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 30px)",
            }}
          >
            {pages[selectedIndex]}
          </motion.div>
        </AnimatePresence>

        {!isGalleryTab && <ContactFooter />}
        {!isGalleryTab && viewCount !== -1 && (
          <div className="w-full bg-transparent py-4 text-center relative z-10">
            <p className="text-gray-400 text-sm">Total {viewCount} views</p>
          </div>
        )}
      </main>
    </motion.div>
  );
}

