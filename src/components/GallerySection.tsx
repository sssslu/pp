"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

const galleryItems = [
    // Childhood & School
    { url: "https://i.imgur.com/fC7z17v.png", description: "증명사진", category: "학창시절" },
    { url: "https://i.imgur.com/UQo7fOv.png", description: "어릴때", category: "학창시절" },
    { url: "https://i.imgur.com/DJ7b4PC.png", description: "창원남고 STEAM 전국 대회", category: "학창시절" },
    { url: "https://i.imgur.com/0DB6DQs.png", description: "서울과학기술대학교", category: "학창시절" },
    { url: "https://i.imgur.com/n7necwm.png", description: "졸업", category: "학창시절" },
    { url: "https://i.imgur.com/WWH7gLG.png", description: "졸업 증명서", category: "증명서" },

    // Military
    { url: "https://i.imgur.com/hWrv8Sq.png", description: "KATUSA - 용산 헌병으로 입대", category: "군대" },
    { url: "https://i.imgur.com/xkVmU5Q.png", description: "HMMWV", category: "군대" },
    { url: "https://i.imgur.com/Y0PiOaJ.png", description: "Sgt Figuerra", category: "군대" },
    { url: "https://i.imgur.com/NuOAu3G.png", description: "PMO", category: "군대" },
    { url: "https://i.imgur.com/Zta1dQg.png", description: "My M9", category: "군대" },
    { url: "https://i.imgur.com/uVo5pcu.png", description: "M4 내부", category: "군대" },
    { url: "https://i.imgur.com/Y6QeZPw.png", description: "병적 증명서", category: "증명서" },

    // Work Experience
    { url: "https://i.imgur.com/sekvQtJ.png", description: "태화이노베이션 테블릿 소프트웨어 개발 (농협)", category: "직장" },
    { url: "https://i.imgur.com/zWyoSOb.png", description: "태화이노베이션", category: "직장" },
    { url: "https://i.imgur.com/tf2mfNZ.png", description: "퇴사", category: "직장" },
    { url: "https://i.imgur.com/JYUaxtl.png", description: "BITGET 2023 발리 출장", category: "직장" },
    { url: "https://i.imgur.com/8HWVKOu.png", description: "BITGET 2023 발리 출장 2", category: "직장" },
    { url: "https://i.imgur.com/RcIf80O.png", description: "BITGET 2023 발리 출장 3", category: "직장" },
    { url: "https://i.imgur.com/ke41S5N.png", description: "BITGET WDF 2023 출장", category: "직장" },

    // Projects
    { url: "https://i.imgur.com/dwq05MN.png", description: "auto piano", category: "프로젝트" },
    { url: "https://i.imgur.com/peHT8M2.png", description: "trafficjam2", category: "프로젝트" },
    { url: "https://i.imgur.com/0cL2ce4.png", description: "스마트신호등", category: "프로젝트" },
    { url: "https://i.imgur.com/3ctGNMR.png", description: "애벌레노트", category: "프로젝트" },
    { url: "https://i.imgur.com/nb6U3lc.png", description: "온라인족보", category: "프로젝트" },
    { url: "https://i.imgur.com/oLamvh8.png", description: "스타트업 RS corp", category: "프로젝트" },
    { url: "https://i.imgur.com/Q6L1FMP.png", description: "crypto hunter", category: "프로젝트" },
    { url: "https://i.imgur.com/9lhAKW5.png", description: "GPT vs Gemini 토론 프로그램", category: "프로젝트" },
    { url: "https://i.imgur.com/nCP8gg8.png", description: "써포츠", category: "프로젝트" },
    { url: "https://i.imgur.com/6FBWoGp.png", description: "Project SSS", category: "프로젝트" },

    // Hobbies & Art
    { url: "https://i.imgur.com/5Shgggo.png", description: "프리다이빙 의외의 재능 발견", category: "취미" },
    { url: "https://i.imgur.com/ubrY8Ox.jpeg", description: "AIDA 프리다이버 LV4", category: "취미" },
    { url: "https://i.imgur.com/oxUXNu3.png", description: "작품 - 1종보통따기싫어 1", category: "아트웍" },
    { url: "https://i.imgur.com/V691q2r.png", description: "작품 - 1종보통따기싫어 2", category: "아트웍" },
    // ... other artworks
    { url: "https://i.imgur.com/Gr1u7Qq.png", description: "작품 - 죄를 사하다", category: "아트웍" },
    { url: "https://i.imgur.com/UUObjlX.png", description: "작품 - 죄를 사하다 2", category: "아트웍" },

    // Travel
    { url: "https://i.imgur.com/MrMSVCz.png", description: "여행 - 도쿄", category: "여행" },
    // ... other travel
    { url: "https://i.imgur.com/7vFebfV.jpeg", description: "여행 - 모리셔스", category: "여행" },

    // Certificates
    { url: "https://i.imgur.com/Ug9UdIt.png", description: "어드밴스드 프리다이버 강사 자격", category: "증명서" },
    { url: "https://i.imgur.com/qpCviqY.png", description: "BLSD 강사 자격", category: "증명서" },
    { url: "https://i.imgur.com/bjNwqy2.png", description: "CMAS 국제 심판관 자격 취득", category: "증명서" },
    { url: "https://i.imgur.com/OOoVMNK.png", description: "기타 수중 자격", category: "증명서" },
    { url: "https://i.imgur.com/ikvtDQr.png", description: "오픽", category: "증명서" },


];

const categories = [...new Set(galleryItems.map(item => item.category))];

export default function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const itemsToShow = selectedCategory
    ? galleryItems.filter(item => item.category === selectedCategory)
    : [];

  if (selectedCategory) {
    return (
      <div className="bg-black p-4">
        <button onClick={() => setSelectedCategory(null)} className="mb-4 bg-gray-800 text-white py-2 px-4 rounded">
          &larr; 뒤로가기
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {itemsToShow.map((item) => (
            <div
              key={item.url}
              className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(item.url)}
            >
              <div className="relative w-full h-48">
                <Image
                  src={item.url}
                  alt={item.description}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-2">
                <p className="text-gray-300 text-sm truncate">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative w-full h-auto max-w-4xl max-h-full">
              <Image
                src={selectedImage}
                alt="Full screen"
                width={1200}
                height={800}
                layout="responsive"
                objectFit="contain"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-black p-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-white">갤러리</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {categories.map((category, index) => {
          const firstItem = galleryItems.find(item => item.category === category);
          return (
            <motion.div
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="relative cursor-pointer bg-gray-800 rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
            >
              <div className="relative w-full aspect-square">
                {firstItem && (
                  <Image
                    src={firstItem.url}
                    alt={category}
                    layout="fill"
                    objectFit="cover"
                    className="opacity-50"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-lg font-bold text-center p-2">{category}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
