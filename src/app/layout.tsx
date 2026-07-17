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
