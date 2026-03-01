"use client";

import { useState, createContext, useContext } from "react";
import Image from "next/image";

const RevealContext = createContext<{ isRevealed: boolean; reveal: () => void } | null>(null);

function RevealGroup({ children }: { children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <RevealContext.Provider value={{ isRevealed, reveal: () => setIsRevealed(true) }}>
      {children}
    </RevealContext.Provider>
  );
}

function RedactedItem({ text }: { text: string }) {
  const context = useContext(RevealContext);
  const [localIsRevealed, setLocalIsRevealed] = useState(false);

  const isRevealed = context ? context.isRevealed : localIsRevealed;
  const reveal = context ? context.reveal : () => setLocalIsRevealed(true);

  return (
    <span
      onClick={reveal}
      className={`inline-block cursor-pointer rounded-sm px-1 transition-colors duration-300 ${
        isRevealed ? "bg-transparent" : "bg-black hover:bg-gray-900"
      }`}
    >
      <span
        className={`transition-opacity duration-300 ${
          isRevealed ? "text-gray-300 opacity-100" : "text-transparent opacity-0 select-none"
        }`}
      >
        {text}
      </span>
    </span>
  );
}

function RedactedImage({ src, alt, width, height, className }: { src: string, alt: string, width: number, height: number, className?: string }) {
  const context = useContext(RevealContext);
  const [localIsRevealed, setLocalIsRevealed] = useState(false);

  const isRevealed = context ? context.isRevealed : localIsRevealed;
  const reveal = context ? context.reveal : () => setLocalIsRevealed(true);

  return (
    <div className="relative" onClick={(e) => {
      if (!isRevealed) {
        e.preventDefault();
        e.stopPropagation();
        if (reveal) reveal();
      }
    }}>
      <Image src={src} alt={alt} width={width} height={height} className={className} />
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100 cursor-pointer hover:bg-gray-900"
        }`}
      />
    </div>
  );
}

export default function AboutSection() {
  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="py-4">
          <h2 className="text-xl font-bold text-white">학력과 경력</h2>
          <div className="mt-2 flex flex-col items-start gap-1 text-gray-300">
            <RevealGroup>
              <p>
                - <RedactedItem text="창원남고등학교" /> 졸업 / <RedactedItem text="창원남고 단결정 연구 동아리" /> 활동 및 다회 수상
              </p>
              <p>
                - <RedactedItem text="서울과학기술대학교" /> <RedactedItem text="전자IT미디어공학과" /> 졸업
              </p>
            </RevealGroup>
            <RevealGroup>
              <p>
                - <RedactedItem text="용산 카투사 KATUSA" /> <RedactedItem text="Military Police" /> 만기 전역
              </p>
            </RevealGroup>
            <RevealGroup>
              <p>
                - <RedactedItem text="태화이노베이션" /> <RedactedItem text="R&D 소프트웨어 연구소" /> 연구원
              </p>
              <p>
                - <RedactedItem text="싱가폴 암호화폐 거래소 Bitget" /> 에서 <RedactedItem text="커미션직" />으로 근무
              </p>
            </RevealGroup>
          </div>
        </div>
        <div className="py-6">
          <h2 className="text-xl font-bold text-white">경험</h2>
          <div className="mt-2 flex flex-col items-start gap-1 text-gray-300">
            <RevealGroup>
              <div>
                <p>
                  - <RedactedItem text="GPT API, Python" />, 자동화 시스템을 활용해 <RedactedItem text="실제 트레이딩 시스템" />을 구현하고 운영한 경험이 있습니다. <RedactedItem text="(프로그램 만드는법을 강의로 만들어 인프런에 팔아먹었습니다!)" />
                </p>
              <div className="flex flex-col items-start ml-10 mt-1">
                <svg width="70" height="70" viewBox="0 0 100 100" className="ml-36 -mt-2 text-red-500 fill-none stroke-current stroke-[3px] drop-shadow-lg transform -rotate-12">
                  <path d="M 10 10 C 40 10 50 35 35 55 S 40 90 80 90" strokeLinecap="round" />
                </svg>
                <a
                  href="https://www.inflearn.com/course/gpt-bitget-api%EB%A1%9C-%EB%A7%8C%EB%93%9C%EB%8A%94?cid=337404"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative ml-24 mb-12 transform hover:scale-105 transition-all duration-300 border-4 border-white rounded-lg shadow-2xl overflow-hidden block"
                >
                  {/* 확장자가 png가 아니라면 아래 경로를 수정해주세요 (예: /인프런인증.jpg) */}
                  <RedactedImage src="/images/인프런인증.png" alt="인프런 인증" width={300} height={200} className="object-cover" />
                </a>
              </div>
              </div>
            </RevealGroup>
            <RevealGroup>
              <p>
                - iOS 및 Android용 모바일 앱을 설계하고 배포한 경험이 있습니다.
              </p>
            </RevealGroup>
            <RevealGroup>
              <p>
                - <RedactedItem text="우리은행" /> 사서 프로그램 <RedactedItem text="Fever" /> 와 <RedactedItem text="농협은행" /> 고속 스캔 프로그램 <RedactedItem text="DASS" /> 를 유지보수한 경험이 있습니다.
              </p>
              <p>
                - <RedactedItem text="한국의 개발 관련 연구소" />에서 여러가지 <RedactedItem text="실험적인 프로젝트" />에서 활동한 경험이 있습니다.
              </p>
            </RevealGroup>
            <RevealGroup>
              <p>
                - <RedactedItem text="대형 암호화폐 거래소" />에서 <RedactedItem text="고액의 커미션" />을 받고 <RedactedItem text="핵심 업무" />를 수행한 경험이 있습니다.
              </p>
            </RevealGroup>
            <RevealGroup>
              <div className="flex items-center">
                <p>
                  - <RedactedItem text="과학 유투버" />로 활동한 경험이 있습니다!
                </p>
                <div className="flex items-center ml-2">
                  <svg width="50" height="20" viewBox="0 0 50 20" className="text-red-500 fill-none stroke-current stroke-[3px] drop-shadow-lg">
                    <path d="M 5 10 Q 15 0 25 10 T 45 10" strokeLinecap="round" />
                  </svg>
                  <a
                    href="https://www.youtube.com/@%EA%B3%BC%ED%95%99%EC%AA%BC%EA%B0%80%EB%A6%AC/shorts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative ml-2 transform hover:scale-105 transition-all duration-300 border-4 border-white rounded-lg shadow-2xl overflow-hidden block"
                  >
                    <RedactedImage src="/images/과학쪼가리.png" alt="과학 유투버" width={100} height={75} className="object-cover" />
                  </a>
                </div>
              </div>
            </RevealGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
