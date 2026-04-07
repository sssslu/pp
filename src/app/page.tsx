"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import HobbySection from "@/components/HobbySection";
import PerkSection from "@/components/PerkSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactFooter from "@/components/ContactFooter";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBubbles from "@/components/FloatingBubbles";

// ── 상수 ──────────────────────────────────────────────────────────────

const TABS = ["소개", "능력치!", "프로젝트", "취미", "갤러리"] as const;

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

// ── 유틸 ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewCount, setViewCount]         = useState(-1);
  const [volumeState, setVolumeState]     = useState<"full" | "half" | "off">("full");

  const audioRef    = useRef<HTMLAudioElement>(null);
  const bgmListRef  = useRef<string[]>([]);
  const bgmIndexRef = useRef(0);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || bgmListRef.current.length === 0) return;
    audio.src    = `/bgm/${bgmListRef.current[index]}`;
    audio.volume = 0.3;
    audio.play().catch(() => setVolumeState("off"));
  }, []);

  const cycleVolume = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (volumeState === "full") {
      audio.volume = 0.15;
      setVolumeState("half");
    } else if (volumeState === "half") {
      audio.pause();
      setVolumeState("off");
    } else {
      audio.volume = 0.3;
      audio.play().catch(() => {});
      setVolumeState("full");
    }
  };

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
          bgmIndexRef.current = (bgmIndexRef.current + 1) % list.length;
          playTrack(bgmIndexRef.current);
        }}
      />

      <button
        onClick={cycleVolume}
        aria-label="Cycle volume"
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-300 backdrop-blur-md ${VOLUME_BTN[volumeState]}`}
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
          {TABS.map((label, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button key={label} onClick={() => setSelectedIndex(index)} className="text-center">
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
