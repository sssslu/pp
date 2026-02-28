"use client";

import { useState, useEffect } from "react";
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
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0px, black 30px)",
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
