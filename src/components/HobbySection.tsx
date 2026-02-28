"use client";

import { useState, useEffect } from "react";

export default function HobbySection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/whale.png";
    img.onload = () => setIsLoaded(true);
  }, []);

  return (
    <div
      className={`w-full bg-cover bg-center transition-opacity duration-1000 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundImage: "url('/images/whale.png')" }}
    >
      <div className="w-full bg-black bg-opacity-60">
        <div className="max-w-3xl mx-auto px-8 py-4">
          <div className="py-4">
            <h2 className="text-xl font-bold text-white">
              프리다이빙 (강사 및 국제 심판 자격 보유)
            </h2>
            <p className="mt-2 text-gray-300 whitespace-pre-line">
              2022년 경 자신의 한계에 도전하는 스포츠, 프리다이빙에 입문하게 되어,
              <br />
              <br />
              - SNSI Indoor Freediver
              <br />
              - Freediver
              <br />
              - Advanced Freediver
              <br />
              - Deep Freediver
              <br />
              <br />
              를 순차적으로 취득.
              <br />
              <br />
              이후
              <br />
              - Freediver Instructor
              <br />
              - Advanced Freediver Instructor
              <br />
              강사 자격을 취득하였으며,
              <br />
              <br />
              프리다이빙 센터 Onedive 의 소속 강사로 활동하며
              <br />
              100명 이상의 한국인 및 외국인 수강생에게 자격을 부여함.
              <br />
              <br />
              - BLSD First Aid, EFR Life Savior 등 인명 구조 관련 자격 보유.
              <br />
              - CMAS 국제핀수영협회 심판관 자격(JUDGE 3급)
              <br />
              - 2026 KUA 국가대표선발전 수중심판으로 활동하였음.
              <br />
            </p>
          </div>
          <div className="py-6">
            <h2 className="text-2xl font-bold text-white">
              그림 및 아트웍, 디자인
            </h2>
            <p className="mt-2 text-gray-300">
              예술적인 감각이 있습니다!! (본인 주장, 경력 없음, 갤러리 참조)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
