"use client";

import { useState, createContext, useContext } from "react";
import Image from "next/image";
import { useLanguage } from "@/i18n";
import Hairline from "./Hairline";

const RevealContext = createContext<{ isRevealed: boolean; reveal: () => void } | null>(null);

function RevealGroup({ children }: { children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <RevealContext.Provider value={{ isRevealed, reveal: () => setIsRevealed(true) }}>
      {children}
    </RevealContext.Provider>
  );
}

/** 그룹 안이면 줄 단위로 함께, 밖이면 항목 단위로 혼자 벗겨진다 */
function useReveal() {
  const context = useContext(RevealContext);
  const [localIsRevealed, setLocalIsRevealed] = useState(false);
  return context ?? { isRevealed: localIsRevealed, reveal: () => setLocalIsRevealed(true) };
}

/**
 * 가림 처리된 고유명사.
 *
 * 글자는 언제나 정상 색으로 DOM에 그대로 있고, 그 위를 불투명한 판이 덮는다.
 * 예전처럼 글자 자체에 text-transparent/opacity-0을 걸면 크롤러 눈에는
 * '숨긴 텍스트'가 된다 — 이름 검색 노출이 목표인 페이지에서 학교·회사명 30여 개를
 * 전부 숨긴 텍스트로 만드는 건 최악의 결과다. 가림판은 순수 장식이라 aria-hidden.
 *
 * span+onClick이던 것을 button으로 바꿔 키보드(Tab→Enter)로도 벗길 수 있게 했고,
 * aria-expanded로 벗겨진 상태가 읽히게 했다.
 */
function RedactedItem({ text }: { text: string }) {
  const { isRevealed, reveal } = useReveal();

  return (
    <button
      type="button"
      onClick={reveal}
      aria-expanded={isRevealed}
      className="relative inline-block align-baseline text-left cursor-pointer rounded-sm px-1"
    >
      {/* 글로우는 글자 상자 밖까지 번져 가림판이 덮지 못한다 — 가린 동안엔 꺼야 윤곽이 새지 않는다 */}
      <span className={isRevealed ? "text-gray-300" : "text-gray-300 text-glow-none"}>{text}</span>
      <span
        aria-hidden
        className={`absolute inset-0 rounded-sm bg-black ring-1 ring-white/30 transition-opacity duration-300 ${
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-gray-900"
        }`}
      />
    </button>
  );
}

/**
 * 가림 처리된 이미지 링크. 첫 클릭은 이동 대신 가림 해제로 소비한다.
 *
 * 해제 트리거를 <a>가 겸하는 이유: 대화형 요소는 <a> 안에 중첩할 수 없어
 * 별도 button을 둘 수 없다. 대신 링크는 원래 키보드로 도달 가능하므로,
 * 이렇게 두면 Enter로도 마우스와 똑같이 '한 번 벗기고, 그다음 이동'이 된다
 * (예전엔 마우스만 막히고 키보드는 가려진 채로 바로 외부로 나갔다).
 */
function RedactedImageLink({
  href, linkClassName, src, alt, width, height, imageClassName,
}: {
  href: string;
  linkClassName: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  imageClassName?: string;
}) {
  const { isRevealed, reveal } = useReveal();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-expanded={isRevealed}
      onClick={(e) => {
        if (!isRevealed) {
          e.preventDefault();
          e.stopPropagation();
          reveal();
        }
      }}
      className={linkClassName}
    >
      <Image src={src} alt={alt} width={width} height={height} className={imageClassName} />
      <span
        aria-hidden
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-gray-900"
        }`}
      />
    </a>
  );
}

/**
 * 경력 한 줄 — 연도 칸과 내용 칸.
 * items-baseline이라 연도가 내용의 첫 줄과 같은 기준선에 앉고, 내용이 길어 줄이
 * 바뀌어도 둘째 줄은 연도 칸 오른쪽에서 이어진다(예전엔 하이픈 밑으로 떨어졌다).
 */
function CareerRow({ year, children }: { year: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 py-2.5">
      <dt className="w-14 shrink-0 font-mono text-sm tabular-nums text-cyan-300/70 text-glow-none">
        {year}
      </dt>
      <dd className="min-w-0 text-gray-300 leading-relaxed">{children}</dd>
    </div>
  );
}

/**
 * 경험 한 항목 — 머리에 HobbySection DiveLog와 같은 눈금 틱을 단다.
 * 탭 안의 목록이 전부 같은 표시(틱)를 쓰게 해서 한 문법으로 읽히게 한다.
 */
function ExpItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-5 text-gray-300 leading-relaxed">
      <span aria-hidden className="absolute left-0 top-[0.85em] h-px w-2.5 bg-cyan-400/50" />
      {children}
    </li>
  );
}

/*
 * 본문을 t.about.edu / t.about.exp 슬롯이 아니라 로케일별 JSX로 직접 쓴다.
 * 리댁션 조각이 문장 중간에 박혀 있어 마크업과 번역문이 한 덩어리인 탓도 있지만,
 * 결정적인 이유는 지금 로케일에 있는 슬롯 데이터가 화면과 어긋나 있다는 것이다:
 *  - edu: 연도 접두("2012~")가 통째로 없고, line1엔 화면에 없는 "다회 수상"이 붙어 있으며,
 *    line3·line4는 슬롯이 하나인데 화면엔 가림 항목이 둘이다. 2025~ 줄은 대응 키가 없다.
 *  - exp: line1~3, line5, line6은 화면과 정확히 일치하지만 line4는 대응하는 줄이 없다.
 * 그대로 갈아끼우면 보이는 이력이 조용히 바뀐다 — 이력은 조용히 바뀌면 안 된다.
 * 로케일 슬롯을 화면과 일치시키기 전까진 이 파일이 원본이다. 문구 수정은 여기서.
 *
 * 배치: 경력은 연도 칸 + 줄 헤어라인(dl), 경험은 눈금 목록(ul). 예전엔 '- 2012~'처럼
 * 하이픈과 연도를 문장 속에 박아 넣어 연도로 훑을 수가 없었고, 모바일에서 줄이 바뀌면
 * 둘째 줄이 하이픈 밑으로 떨어졌다. 문구는 그대로 두고 하이픈만 빼 연도를 칸으로 옮겼다.
 */
export default function AboutSection() {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8">
      <section className="py-8">
        <h2 className="text-xl font-bold text-white">{t.about.educationTitle}</h2>
        {/* RevealGroup은 DOM을 만들지 않는다 — 행이 dl의 직계 자식으로 남아 divide-y가 먹는다 */}
        <dl className="mt-3 divide-y divide-gray-800/70">
          <RevealGroup>
            <CareerRow year="2012~">
              {isEn ? (
                <>Active in <RedactedItem text="Changwonnam High Single Crystal Research Club" /></>
              ) : (
                <><RedactedItem text="창원남고 단결정 연구 동아리" /> 활동</>
              )}
            </CareerRow>
            <CareerRow year="2015~">
              {isEn ? (
                <>Graduated from <RedactedItem text="Seoul National University of Science and Technology" /> — <RedactedItem text="Electronic IT Media Engineering" /></>
              ) : (
                <><RedactedItem text="서울과학기술대학교" /> <RedactedItem text="전자IT미디어공학과" /> 졸업</>
              )}
            </CareerRow>
          </RevealGroup>
          <RevealGroup>
            <CareerRow year="2016~">
              {isEn ? (
                <><RedactedItem text="Yongsan KATUSA" /> <RedactedItem text="Military Police" /> — Honorably discharged</>
              ) : (
                <><RedactedItem text="용산 KATUSA" /><RedactedItem text="Military Police" /> 만기 전역</>
              )}
            </CareerRow>
          </RevealGroup>
          <RevealGroup>
            <CareerRow year="2021~">
              {isEn ? (
                <><RedactedItem text="TaehwaInnovation" /> <RedactedItem text="R&D Software Lab" /> — Researcher</>
              ) : (
                <><RedactedItem text="태화이노베이션" /> <RedactedItem text="R&D 소프트웨어 연구소" /> 연구원</>
              )}
            </CareerRow>
            <CareerRow year="2022~">
              {isEn ? (
                <>Worked at <RedactedItem text="Singapore crypto exchange Bitget" /> in a <RedactedItem text="commission-based role" /></>
              ) : (
                <><RedactedItem text="싱가폴 암호화폐 거래소 Bitget" /> 에서 <RedactedItem text="커미션직" />으로 근무</>
              )}
            </CareerRow>
            <CareerRow year="2025~">
              <RedactedItem text="AI Quant" />
            </CareerRow>
          </RevealGroup>
        </dl>
      </section>

      <Hairline />

      <section className="py-8">
        <h2 className="text-xl font-bold text-white">{t.about.experienceTitle}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          <RevealGroup>
            <ExpItem>
              <p>
                {isEn ? (
                  <>Used <RedactedItem text="various LLM APIs" /> and automation systems to build and operate a <RedactedItem text="real trading system" />. <RedactedItem text="(Sold a course too!)" /></>
                ) : (
                  <><RedactedItem text="각종 LLM API" />, 자동화 시스템을 활용해 <RedactedItem text="실제 트레이딩 시스템" />을 구현하고 운영한 경험이 있습니다. <RedactedItem text="(강의도 팔았습니다)" /></>
                )}
              </p>
              {/* 틱 들여쓰기(pl-5)만큼 ml을 줄여 화살표·카드의 절대 위치는 예전 그대로 둔다 */}
              <div className="flex flex-col items-start ml-5 mt-1">
                <svg aria-hidden width="70" height="70" viewBox="0 0 100 100" className="ml-36 -mt-2 text-red-500 fill-none stroke-current stroke-[3px] drop-shadow-lg transform -rotate-12">
                  <path d="M 10 10 C 40 10 50 35 35 55 S 40 90 80 90" strokeLinecap="round" />
                </svg>
                <RedactedImageLink
                  href="https://www.inflearn.com/course/gpt-bitget-api%EB%A1%9C-%EB%A7%8C%EB%93%9C%EB%8A%94?cid=337404"
                  linkClassName="relative ml-24 mb-4 transform hover:scale-105 transition-all duration-300 border-4 border-white rounded-lg shadow-2xl overflow-hidden block"
                  src="/images/인프런인증.png"
                  alt="Inflearn certification"
                  width={300}
                  height={200}
                  imageClassName="object-cover"
                />
              </div>
            </ExpItem>
          </RevealGroup>
          <ExpItem>
            {isEn
              ? "Designed and deployed mobile apps for iOS and Android."
              : "iOS 및 Android용 모바일 앱을 설계하고 배포한 경험이 있습니다."}
          </ExpItem>
          <RevealGroup>
            <ExpItem>
              {isEn ? (
                <>Maintained <RedactedItem text="Woori Bank" />&apos;s library program <RedactedItem text="Fever" /> and <RedactedItem text="NongHyup Bank" />&apos;s high-speed scanning program <RedactedItem text="DASS" />.</>
              ) : (
                <><RedactedItem text="우리은행" /> 사서 프로그램 <RedactedItem text="Fever" /> 와 <RedactedItem text="농협은행" /> 고속 스캔 프로그램 <RedactedItem text="DASS" /> 를 유지보수한 경험이 있습니다.</>
              )}
            </ExpItem>
          </RevealGroup>
          <RevealGroup>
            <ExpItem>
              {isEn ? (
                <>Performed <RedactedItem text="core duties" /> at a <RedactedItem text="major crypto exchange" /> under <RedactedItem text="high commissions" />.</>
              ) : (
                <><RedactedItem text="대형 암호화폐 거래소" />에서 <RedactedItem text="고액의 커미션" />을 받고 <RedactedItem text="핵심 업무" />를 수행한 경험이 있습니다.</>
              )}
            </ExpItem>
          </RevealGroup>
          <RevealGroup>
            <ExpItem>
              {/* items-start: 가운데 정렬이면 글이 썸네일 높이의 중간으로 내려가 틱과 어긋난다 */}
              <div className="flex items-start">
                <p>
                  {isEn ? (
                    <>Worked as a <RedactedItem text="Science YouTuber" />!</>
                  ) : (
                    <><RedactedItem text="과학 유투버" />로 활동한 경험이 있습니다!</>
                  )}
                </p>
                <div className="flex shrink-0 items-center ml-2 mt-0.5">
                  <svg aria-hidden width="50" height="20" viewBox="0 0 50 20" className="text-red-500 fill-none stroke-current stroke-[3px] drop-shadow-lg">
                    <path d="M 5 10 Q 15 0 25 10 T 45 10" strokeLinecap="round" />
                  </svg>
                  <RedactedImageLink
                    href="https://www.youtube.com/@%EA%B3%BC%ED%95%99%EC%AA%BC%EA%B0%80%EB%A6%AC/shorts"
                    linkClassName="relative ml-2 transform hover:scale-105 transition-all duration-300 border-4 border-white rounded-lg shadow-2xl overflow-hidden block"
                    src="/images/과학쪼가리.png"
                    alt="Science YouTuber"
                    width={100}
                    height={75}
                    imageClassName="object-cover"
                  />
                </div>
              </div>
            </ExpItem>
          </RevealGroup>
        </ul>
      </section>
    </div>
  );
}
