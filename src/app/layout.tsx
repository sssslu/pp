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
  title: "Slu Park's Portfolio",
  description: "Personal portfolio of Slu Park",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Slu Park's Portfolio",
    description: "Personal portfolio of Slu Park",
    url: "https://slupark.com",
    images: [
      {
        url: "https://slupark.com/images/front.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
