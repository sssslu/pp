"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n";

export default function HobbySection() {
  const { t } = useLanguage();
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
              {t.hobby.freedivingTitle}
            </h2>
            <p className="mt-2 text-gray-300 whitespace-pre-line">
              {t.hobby.freedivingContent}
            </p>
          </div>
          <div className="py-6">
            <h2 className="text-2xl font-bold text-white">
              {t.hobby.artTitle}
            </h2>
            <p className="mt-2 text-gray-300">
              {t.hobby.artContent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
