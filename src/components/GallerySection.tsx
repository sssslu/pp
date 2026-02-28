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
    { url: "https://i.imgur.com/Gr1u7Qq.png", description: "작품 - 죄를 사하다", category: "아트웍" },
    { url: "https://i.imgur.com/UUObjlX.png", description: "작품 - 죄를 사하다 2", category: "아트웍" },

    // Travel
    { url: "https://i.imgur.com/MrMSVCz.png", description: "여행 - 도쿄", category: "여행" },
    { url: "https://i.imgur.com/7vFebfV.jpeg", description: "여행 - 모리셔스", category: "여행" },

    // Certificates
    { url: "https://i.imgur.com/Ug9UdIt.png", description: "어드밴스드 프리다이버 강사 자격", category: "증명서" },
    { url: "https://i.imgur.com/qpCviqY.png", description: "BLSD 강사 자격", category: "증명서" },
    { url: "https://i.imgur.com/bjNwqy2.png", description: "CMAS 국제 심판관 자격 취득", category: "증명서" },
    { url: "https://i.imgur.com/OOoVMNK.png", description: "기타 수중 자격", category: "증명서" },
    { url: "https://i.imgur.com/ikvtDQr.png", description: "오픽", category: "증명서" },

    // Meta
    { url: "https://i.imgur.com/6koByeg.png", description: "해당 포트폴리오 페이지는 FLUTTER 웹앱 입니다! :)", category: "기타" },
    { url: "https://i.imgur.com/iw7lXVi.png", description: "처음부터 끝까지 레퍼런스없이 직접 제작하였습니다! :)", category: "기타" },
];

const categories = [...new Set(galleryItems.map(item => item.category))];

function CategoryItem({ category, item, onClick, variants }: { category: string, item: any, onClick: () => void, variants: any }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      onClick={onClick} 
      className="cursor-pointer bg-gray-800 rounded-lg flex flex-col items-center justify-center aspect-square relative overflow-hidden group"
      variants={variants}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
        {item && (
            <Image
                src={item.url}
                alt={category}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover transition-opacity duration-1000 ease-in-out ${isLoaded ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`}
                onLoad={() => setIsLoaded(true)}
            />
        )}
        <div className="z-10 flex flex-col items-center">
            <span className="text-white text-center font-bold drop-shadow-md text-xl">{category}</span>
        </div>
    </motion.div>
  );
}

function GalleryImageItem({ item, onClick, variants }: { item: any, onClick: () => void, variants: any }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
      variants={variants}
    >
      <div className="relative w-full h-48">
        <Image
          src={item.url}
          alt={item.description}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      <div className="p-2">
        <p className="text-gray-300 text-sm truncate">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const itemsToShow = selectedCategory
    ? galleryItems.filter(item => item.category === selectedCategory)
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (selectedCategory) {
    return (
      <div className="p-4">
        <button onClick={() => setSelectedCategory(null)} className="mb-4 bg-gray-800 text-white py-2 px-4 rounded">
          &larr; 뒤로가기
        </button>
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
          {itemsToShow.map((item) => (
            <GalleryImageItem
              key={item.url}
              item={item}
              onClick={() => setSelectedImage(item.url)}
              variants={itemVariants}
            />
          ))}
        </motion.div>
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img src={selectedImage} alt="Full screen" className="max-w-full max-h-[90vh]" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
        <h2 className="text-2xl font-bold text-center mb-6">갤러리</h2>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" variants={containerVariants} initial="hidden" animate="visible">
            {categories.map(category => {
                const firstItem = galleryItems.find(item => item.category === category);
                return (
                <CategoryItem
                    key={category}
                    category={category}
                    item={firstItem}
                    onClick={() => setSelectedCategory(category)}
                    variants={itemVariants}
                />
            )})}
        </motion.div>
    </div>
  );
}
