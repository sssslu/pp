"use client";

import { useState, useEffect, useRef } from "react";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import HobbySection from "@/components/HobbySection";
import PerkSection from "@/components/PerkSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactFooter from "@/components/ContactFooter";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBubbles from "@/components/FloatingBubbles";

const TABS = ["저는...", "능력치!", "프로젝트", "취미", "갤러리"];

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewCount, setViewCount] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchViewCount = async () => {
      try {
        const res = await fetch("https://slusphere.fly.dev/viewcount/1", {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setViewCount(data.viewCount);
        } else {
          setViewCount(0);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch view count:", error);
          setViewCount(0);
        }
      }
    };
    fetchViewCount();
    return () => controller.abort();
  }, []);

  const pages = [
    <AboutSection key="about" />,
    <PerkSection key="perk" />,
    <ProjectsSection key="projects" />,
    <HobbySection key="hobby" />,
    <GallerySection key="gallery" />,
  ];

  const isGalleryTab = selectedIndex === 4;

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="bg-[#0a0a0a] min-h-screen text-white"
    >
      <FloatingBubbles />
      <audio ref={audioRef} src="/bgm.mp3" loop />
      <button
        onClick={togglePlay}
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-300 backdrop-blur-md group ${
          isPlaying
            ? "bg-cyan-900/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]"
            : "bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]"
        }`}
        aria-label="Toggle music"
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,1)] animate-pulse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,1)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
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
        <div className="sticky top-0 z-20 bg-transparent backdrop-blur-sm h-12 flex justify-evenly items-center">
          {TABS.map((label, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={label}
                onClick={() => setSelectedIndex(index)}
                className="text-center"
              >
                <span
                  className={`${
                    isSelected
                      ? "text-white font-bold"
                      : "text-gray-400 font-normal"
                  }`}
                >
                  {label}
                </span>
                {isSelected && (
                  <div className="mt-1 h-[2px] w-5 bg-white mx-auto" />
                )}
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full relative z-10"
            style={
              isGalleryTab
                ? undefined
                : {
                    maskImage: "linear-gradient(to bottom, transparent 0px, black 30px)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 30px)",
                  }
            }
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
