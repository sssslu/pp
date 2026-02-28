"use client";

import { useState } from "react";

function RedactedItem({ text }: { text: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <span
      onClick={() => setIsRevealed(true)}
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

export default function AboutSection() {
  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="py-4">
          <h2 className="text-xl font-bold text-white">학력과 경력</h2>
          <div className="mt-2 flex flex-col items-start gap-1 text-gray-300">
            <p>
              - <RedactedItem text="창원남고등학교" /> 졸업 / <RedactedItem text="창원남고 단결정 연구 동아리" /> 활동 및 다회 수상
            </p>
            <p>
              - <RedactedItem text="서울과학기술대학교" /> <RedactedItem text="전자IT미디어공학과" /> 졸업
            </p>
            <p>
              - <RedactedItem text="용산 카투사 KATUSA" /> <RedactedItem text="Military Police" /> 만기 전역
            </p>
            <p>
              - <RedactedItem text="태화이노베이션" /> <RedactedItem text="R&D 소프트웨어 연구소" /> 연구원
            </p>
            <p>
              - <RedactedItem text="싱가폴 암호화폐 거래소 Bitget" /> 에서 <RedactedItem text="중요직" />으로 근무
            </p>
            <p className="mt-4">
              현재 속세를 떠나 특이점을 기다리는, 방구석 연구자이자 코더로 활동중입니다.
            </p>
          </div>
        </div>
        <div className="py-6">
          <h2 className="text-xl font-bold text-white">경험</h2>
          <div className="mt-2 flex flex-col items-start gap-1 text-gray-300">
            <p>
              - <RedactedItem text="GPT API, Python" />, 자동화 시스템을 활용해 <RedactedItem text="실제 트레이딩 시스템" />을 구현하고 운영한 경험이 있습니다.
            </p>
            <p>
              - <RedactedItem text="Flutter" />와 <RedactedItem text="Android Studio" />를 이용해 iOS 및 Android용 모바일 앱을 설계하고 배포한 경험이 있습니다.
            </p>
            <p>
              - <RedactedItem text="우리은행" /> 사서 프로그램 <RedactedItem text="Fever" /> 와 <RedactedItem text="농협은행" /> 고속 스캔 프로그램 <RedactedItem text="DASS" /> 를 유지보수한 경험이 있습니다.
            </p>
            <p>
              - <RedactedItem text="한국의 개발 관련 연구소" />에서 여러가지 <RedactedItem text="실험적인 프로젝트" />에서 활동한 경험이 있습니다.
            </p>
            <p>
              - <RedactedItem text="대형 암호화폐 거래소" />에서 <RedactedItem text="고액의 커미션" />을 받고 <RedactedItem text="핵심 업무" />를 수행한 경험이 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
