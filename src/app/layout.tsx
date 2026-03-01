import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
        url: "https://slupark.com/front.png",
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
