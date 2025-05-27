// app/page.tsx

"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <main className="min-h-screen bg-black text-white w-full max-w-none">
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6 bg-gradient-to-b from-gray-800 to-black">
        <h1 className="text-5xl font-bold mb-4">Portfolio : Slu Park</h1>
        <p className="text-lg text-gray-300 max-w-xl">
          실전 프로젝트들을 통해 성장하였고,<br />다양한 고객 관리 경험도 있는,<br />깊이 있고 열린 마음의 풀스택 개발자를 꿈꾸는 사람입니다.
        </p>
      </section>

      {/* Tab Menu */}
      <section className="pt-12 px-6 bg-black">
        <div className="flex space-x-6 border-b border-gray-600">
          {["about", "projects", "hobby", "gallery"].map((key) => {
            const tabLabels: { [key: string]: string } = {
              about: "About Me",
              projects: "Side Projects",
              hobby: "Hobby",
              gallery: "Gallery"
            };

            return (
              <button
                key={key}
                className={`pb-2 font-semibold ${activeTab === key
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400"
                  }`}
                onClick={() => setActiveTab(key)}
              >
                {tabLabels[key]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === "about" && (
        <section className="py-12 px-6 bg-black" id="about">
          <h2 className="text-3xl font-bold mb-4">Education</h2>
          <p className="text-gray-300 max-w-4xl mb-6">
            창원남고등학교 졸업 / 창원남고 단결정 연구 동아리 활동 및 다회 수상<br />
            서울과학기술대학교 전자IT미디어공학과 졸업<br />
            용산 카투사 Military Police 만기 전역<br />
            태화이노베이션 R&D 소프트웨어 연구소 연구원<br />
            싱가폴 암호화폐 거래소 Bitget 에서 중요직으로 근무<br />
            현재 속세를 떠나 특이점을 기다리는, 방구석 사색가이자 개발자로 활동중입니다.
            <br />
            <br />
            <br />
          </p>
          <h2 className="text-3xl font-bold mb-4">Experience</h2>
          <p className="text-gray-300 max-w-4xl">
            GPT API, Python, 자동화 시스템을 활용해 실제 트레이딩 시스템을 구현하고 운영한 경험이 있습니다.<br />
            Flutter와 Android Studio를 이용해 iOS 및 Android용 모바일 앱을 설계하고 배포한 경험이 있습니다.<br />
            우리은행 사서 프로그램 Fever 와 농협은행 고속 스캔 프로그램 DASS 를 유지보수한 경험이 있습니다.<br />
            한국의 개발 관련 연구소에서 우리은행의 메타버스 지점 구축 등 실험적인 프로젝트에서 활동한 경험이 있습니다.<br />
            대형 암호화폐 거래소에서 고액의 연봉을 받고 고객 유치 및 관리 관련 핵심 업무를 수행한 경험이 있습니다.<br />
            <br />
            <br />
            <br />
          </p>
          <h2 className="text-3xl font-bold mb-4">Perk!</h2>
          <p className="text-gray-300 max-w-4xl">
            주어진 직무를 창의적으로 수행할 수 있습니다.<br />
            최신 기술에 관심이 많고, 트렌디한 방법을 추구합니다.<br />
            책임감이 강하여 금전적인 이득이 보장이 되지 않은 상황에서도 맡은 바 최선을 다합니다.<br />
            영어에 능통하여, 외국인 고객을 대하는 데에 거리낌이 없습니다.<br />
            <br />
            <br />
            <br />
          </p>
          <h2 className="text-3xl font-bold mb-4">Stack</h2>
          <p className="text-gray-300 max-w-4xl">
            C<br />
            C#<br />
            Java<br />
            Dart<br />
            Flutter<br />
            React<br />
            Next.js<br />
            Python<br />
            Node.js<br />
            JavaScript<br />
            TypeScript<br />
            Firebase Auth<br />
            DB의 SQL 및 CRUD
          </p>
          <p className="text-xs text-gray-500 mb-4">
            UmmLang(엄준식랭귀지)
          </p>
          

        </section>
      )}

      {activeTab === "projects" && (
        <section className="py-12 px-6 bg-black max-w-4xl mx-auto" id="sideprojects">
          <h2 className="text-3xl font-bold mb-10">Side Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {["CryptoHunter", "안동장씨 남해 종친회", "Auto Piano", "AI Localization PJ", "Trafficjam2", "애벌레노트", "촉각전달기", "KakaoTalt","Supports"].map((title, idx) => {
              const descriptions = [
                "실시간 데이터 수집, GPT 전략 판단, 실제 자동 주문 실행까지 연동한 시스템. 로그 기록 및 리스크 관리 기능 포함. 넓게 보면 소규모의 AI 에이전트 이다.",
                "남해의 안동 장씨 계보도를 재귀함수와 NONSQL-DB, 그리고 NodeJS 를 이용해 한눈에 볼 수 있도록 설계한 온라인 족보 프로그램. 족보를 트리 형태로 구현한 최초의 웹앱",
                "ArtMega Microprocessor 와 C언어를 이용해 만든 반응속도 높은 피아노. 컴퓨터와 연결하면 Putty 입력을 통해 키보드로 연주 가능.",
                "ollama 와 Deepseek 오픈소스, 그리고 RTX 4080 SUPER GPU로 Deepseek 8b/14b를 로컬로 구현.",
                "객체 지향형 언어인 Java 로 자동차 객체를 섬세하게 구현하고 콘솔로 교통 체증이 발생하는 이유를 가시화한 실험적 시뮬레이터.",
                "Flutter 로 구현한 아이젠하워 매트릭스 기반의 메모/체크리스트 앱. 에버노트의 복잡함을 비판하며 설계. (부모님도 사용합니다)",
                "아두이노, 그리고 여러 개의 전선과... 모터들을 이용하여 그리드를 생성하여, 입력 단의 촉각을 사용자에게 비슷한 형태로 전달해줄 수 있었던 프로젝트. 당시에는 나름 혁신적이었다...",
                "Flutter 로 구현한 코로나 카카오톡 백신패스 인증 우회 앱. 단순한 구조의 눈속임 앱이다.",
                "운동 플랫폼 모바일 어플리케이션 써포츠의 프론트엔드를 일부 설계 및 제작했다. Firebase Auth를 사용한 소셜 로그인 구현부를 맡았다."
              ];
              return (
                <div key={idx} className="p-6 border border-gray-700 rounded-xl shadow-md bg-black text-white flex flex-col justify-between">
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm whitespace-pre-line overflow-hidden overflow-ellipsis flex-grow">
                    {descriptions[idx]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "gallery" && (
        <section className="py-12 px-6 bg-black" id="gallery">
          <h2 className="text-3xl font-bold mb-4">Gallery</h2>
          <p className="text-gray-300">아직 업로드된 이미지가 없습니다. 추후 프로젝트 이미지 및 스크린샷이 여기에 표시됩니다.</p>
        </section>
      )}

      {activeTab === "hobby" && (
        <section className="py-12 px-6 bg-black" id="about">
          <h2 className="text-3xl font-bold mb-4">Freediving</h2>
          <p className="text-gray-300 max-w-4xl mb-6">
            2022년 경 자신의 한계에 도전하는 스포츠, 프리다이빙에 입문하게 되어,<br />
            SNSI Indoor Freediver<br />
            SNSI Freediver,<br />
            SNSI Advanced Freediver,<br />
            SNSI Deep Freediver 를 순차적으로 취득함.<br />
            이후 Freediver Instructor,<br />
            Advanced Freediver Instructor<br />
            강사 자격을 취득하였으며<br />
            프리다이빙 센터 Onedive 의 소속 강사로 활동하며 150명 이상의 한국인 및 외국인 다이버를 배출함.<br />
            BLSD First Aid,<br />EFR Life Savior 등 인명 구조 관련 자격,<br />CMAS 국제핀수영협회 심판관 자격 또한 보유.
            <br />
            <br />
            <br />
          </p>
          <h2 className="text-3xl font-bold mb-4">FPV Drone</h2>
          <p className="text-gray-300 max-w-4xl">
            일인칭 시점 드론을 운용할 수 있으며, 간단한 촬영 및 영상 편집도 가능<br />
            해외 드론 촬영 경험 다수
          </p>
        </section>
      )}



      {/* Contact Section */}
      <section className="py-24 px-6 bg-black" id="contact">
        <h2 className="text-1xl font-bold mt-40 mb-1">Contact</h2>
        <p className="text-sm font-mono text-blue-400">slu@kakao.com</p>
      </section>
    </main>
  );
}
