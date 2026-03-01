"use client";

import { useState, useMemo } from "react";
import { motion, Variants } from "framer-motion";

const SKILLS = [
  "C", "C#", "Java", "Dart", "React", "Flutter",
  "Next.js", "Python", "Node.js", "JavaScript",
  "TypeScript", "Firebase Auth", "DB의 SQL 및 CRUD"
];

export default function PerkSection() {
  const [isRevealed, setIsRevealed] = useState(false);

  // 각 스킬 아이템별로 폭발/붕괴 효과를 위한 랜덤 값을 생성합니다.
  // useMemo를 사용하여 리렌더링 시에도 애니메이션 방향이 바뀌지 않도록 합니다.
  const explosionEffects = useMemo(() => {
    return SKILLS.map(() => ({
      x: (Math.random() - 0.5) * 500, // 좌우로 넓게 퍼짐
      y: (Math.random() * 300) + 50,  // 아래로 무너져 내림 (중력 느낌)
      rotate: (Math.random() - 0.5) * 180, // 랜덤 회전
      scale: 0.5 + Math.random() * 0.5, // 크기 변화
    }));
  }, []);

  const itemVariants: Variants = {
    hidden: { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" },
    visible: (custom: any) => ({
      opacity: [1, 1, 0],
      scale: [1, 1, 0],
      filter: ["blur(0px)", "blur(0px)", "blur(4px)"],
      x: [0, 2, -2, 2, -2, 1, -1, 0, custom.x],
      y: [0, 1, -1, 1, -1, 0, 0, 0, custom.y],
      rotate: [0, 0, 0, 0, 0, 0, 0, 0, custom.rotate],
      transition: {
        duration: 3, // 전체 애니메이션 시간 (초). 이 값을 늘리면 진동 시간도 길어집니다.
        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1], // 0 ~ 0.7 구간이 진동, 0.7 ~ 1 구간이 폭발
        ease: "easeInOut"
      }
    })
  };

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="py-4">
          <h2 className="text-xl font-bold text-white">강점</h2>
          <p className="mt-2 text-gray-300 whitespace-pre-line">
            - 창의성
            <br />- 책임감
            <br />- 능통한 영어
          </p>
        </div>
        <div 
          className="py-6 cursor-pointer relative group"
          onMouseEnter={() => setIsRevealed(true)}
          onTouchStart={() => setIsRevealed(true)}
          onClick={() => setIsRevealed(true)}
        >
          <h2 className="text-xl font-bold text-white mb-4 transition-colors duration-300">스택</h2>
          
          {/* 스킬 목록 컨테이너 */}
          <div className="relative min-h-[400px]">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill}
                className="text-gray-300 text-lg font-medium origin-center mb-1"
                custom={explosionEffects[index]}
                variants={itemVariants}
                initial="hidden"
                animate={isRevealed ? "visible" : "hidden"}
              >
                {skill}
              </motion.div>
            ))}

            {/* AI 텍스트 등장 효과 */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={isRevealed ? { 
                opacity: 1, 
                scale: 1, 
                filter: "blur(0px)" 
              } : { 
                opacity: 0, 
                scale: 0.5, 
                filter: "blur(10px)" 
              }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15, 
                delay: 1.0 
              }}
            >
              <p className="text-yellow-400 font-bold text-9xl drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                AI
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
