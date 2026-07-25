import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// viewportFit: cover — iOS 노치/홈 인디케이터 영역까지 그리고
// env(safe-area-inset-*)로 하단 도크·볼륨 버튼 위치를 보정한다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://slupark.com"),
  title: "박슬우 (Slu Park) | slupark — Portfolio",
  description:
    "박슬우(Slu Park)의 개인 포트폴리오 slupark.com — 프로젝트, 경력, 취미를 소개합니다. Personal portfolio of Slu Park (slupark, slu): projects, career, and hobbies.",
  keywords: [
    "박슬우", "박 슬우", "슬우", "Slu Park", "slupark", "slu",
    "포트폴리오", "portfolio", "개발자", "developer",
  ],
  authors: [{ name: "박슬우 (Slu Park)", url: "https://slupark.com" }],
  creator: "박슬우 (Slu Park)",
  alternates: {
    canonical: "https://slupark.com",
  },
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "slupark",
    locale: "ko_KR",
    alternateLocale: "en_US",
    title: "박슬우 (Slu Park) | slupark — Portfolio",
    description:
      "박슬우(Slu Park)의 개인 포트폴리오 — 프로젝트, 경력, 취미. Personal portfolio of Slu Park.",
    url: "https://slupark.com",
    images: [
      {
        url: "https://slupark.com/images/front.png",
        width: 1200,
        height: 630,
        alt: "박슬우 (Slu Park) portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "박슬우 (Slu Park) | slupark — Portfolio",
    description:
      "박슬우(Slu Park)의 개인 포트폴리오 — 프로젝트, 경력, 취미. Personal portfolio of Slu Park.",
    images: ["https://slupark.com/images/front.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// 구조화 데이터(JSON-LD): 구글이 "박슬우 = Slu Park = slupark = 이 사이트"라는
// 인물-사이트 연결을 이해하게 하는 핵심 장치. 이름 검색 노출에 가장 크게 기여한다.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://slupark.com/#person",
      name: "박슬우",
      alternateName: ["Slu Park", "slupark", "slu", "박 슬우", "Park Slu"],
      url: "https://slupark.com",
      image: "https://slupark.com/images/front.png",
      email: "mailto:slu@kakao.com",
      jobTitle: "Software Developer",
      knowsLanguage: ["ko", "en"],
      alumniOf: { "@id": "https://slupark.com/#seoultech" },
      // 인물 엔티티를 외부 프로필과 잇는 고리 — 구글이 "이 사람"의 동일성을
      // 사이트 밖에서도 확인할 수 있게 한다. 저장소 안에 실제로 존재하는 링크만 넣었다
      // (AboutSection의 유튜브 채널). 채널 하위 탭(/shorts)은 떼어 정규 주소로 맞췄다.
      //
      // sameAs는 '엔티티의 정체를 확인해 주는 참조 페이지'(공식 사이트·소셜 프로필·위키데이터)
      // 전용이다. 인프런 강의 주소는 사람의 프로필이 아니라 상품 페이지라 제외했다 —
      // 정체성과 무관한 링크를 섞으면 엔티티 신호가 희석된다.
      // GitHub/LinkedIn 주소는 저장소 어디에도 없어 비워 둔다 — 생기면 여기에 추가한다.
      sameAs: [
        "https://www.youtube.com/@%EA%B3%BC%ED%95%99%EC%AA%BC%EA%B0%80%EB%A6%AC",
      ],
    },
    {
      // AboutSection·i18n 캡션에 이미 있는 학력 사실을 엔티티로만 승격한다.
      // 이름은 저장소에 실재하는 표기 그대로 쓴다 (ko.ts / en.ts의 school-seoultech).
      "@type": "EducationalOrganization",
      "@id": "https://slupark.com/#seoultech",
      name: "서울과학기술대학교",
      alternateName: "Seoul National University of Science and Technology",
    },
    {
      "@type": "WebSite",
      "@id": "https://slupark.com/#website",
      url: "https://slupark.com",
      name: "slupark",
      alternateName: ["박슬우 포트폴리오", "Slu Park Portfolio"],
      inLanguage: ["ko", "en"],
      about: { "@id": "https://slupark.com/#person" },
      publisher: { "@id": "https://slupark.com/#person" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // SSR 기본 언어가 한국어(ko)이므로 lang도 ko — 언어 전환 시 i18n에서 갱신한다
    <html lang="ko">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
