"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/i18n";
import type { GalleryCategoryId, GalleryItemId } from "@/i18n/locales/ko";

/*
 * 갤러리 데이터는 '구조'만 여기 남는다 — url/id/category.
 * 캡션과 카테고리 표시명은 t.gallery에서 id로 조회한다. 표시 문자열을 이 배열에
 * 두면 로케일 파일과 두 벌이 되어 반드시 드리프트하고, 무엇보다 필터 state가
 * 표시명을 붙들게 되어 언어를 바꾸는 순간 비교가 어긋나 화면이 빈다.
 */
const galleryItems: readonly GalleryItemData[] = [
    // Childhood & School
    { id: "school-idphoto", url: "https://i.imgur.com/fC7z17v.png", category: "school" },
    { id: "school-young", url: "https://i.imgur.com/UQo7fOv.png", category: "school" },
    { id: "school-steam", url: "https://i.imgur.com/DJ7b4PC.png", category: "school" },
    { id: "school-seoultech", url: "https://i.imgur.com/0DB6DQs.png", category: "school" },
    { id: "school-grad", url: "https://i.imgur.com/n7necwm.png", category: "school" },
    { id: "cert-diploma", url: "https://i.imgur.com/WWH7gLG.png", category: "cert" },

    // Military
    { id: "mil-enlist", url: "https://i.imgur.com/hWrv8Sq.png", category: "military" },
    { id: "mil-hmmwv", url: "https://i.imgur.com/xkVmU5Q.png", category: "military" },
    { id: "mil-figuerra", url: "https://i.imgur.com/Y0PiOaJ.png", category: "military" },
    { id: "mil-pmo", url: "https://i.imgur.com/NuOAu3G.png", category: "military" },
    { id: "mil-m9", url: "https://i.imgur.com/Zta1dQg.png", category: "military" },
    { id: "mil-m4", url: "https://i.imgur.com/uVo5pcu.png", category: "military" },
    { id: "mil-me", url: "https://i.imgur.com/QlzKeC3_d.jpeg?maxwidth=520&shape=thumb&fidelity=high", category: "military" },
    { id: "mil-almanza", url: "https://i.imgur.com/O5v8fKw_d.png?maxwidth=520&shape=thumb&fidelity=high", category: "military" },
    { id: "mil-agosto", url: "https://i.imgur.com/CynrBal_d.png?maxwidth=520&shape=thumb&fidelity=high", category: "military" },
    { id: "mil-fierce", url: "https://i.imgur.com/qQorgFu_d.png?maxwidth=520&shape=thumb&fidelity=high", category: "military" },
    { id: "cert-military", url: "https://i.imgur.com/Y6QeZPw.png", category: "cert" },

    // Work Experience
    { id: "work-taehwa-nh", url: "https://i.imgur.com/sekvQtJ.png", category: "work" },
    { id: "work-taehwa", url: "https://i.imgur.com/zWyoSOb.png", category: "work" },
    { id: "work-quit", url: "https://i.imgur.com/tf2mfNZ.png", category: "work" },
    { id: "work-bali1", url: "https://i.imgur.com/JYUaxtl.png", category: "work" },
    { id: "work-bali2", url: "https://i.imgur.com/8HWVKOu.png", category: "work" },
    { id: "work-bali3", url: "https://i.imgur.com/RcIf80O.png", category: "work" },
    { id: "work-wdf", url: "https://i.imgur.com/ke41S5N.png", category: "work" },

    // Projects
    { id: "pj-autopiano", url: "https://i.imgur.com/dwq05MN.png", category: "project" },
    { id: "pj-trafficjam2", url: "https://i.imgur.com/peHT8M2.png", category: "project" },
    { id: "pj-trafficlight", url: "https://i.imgur.com/0cL2ce4.png", category: "project" },
    { id: "pj-everlae", url: "https://i.imgur.com/3ctGNMR.png", category: "project" },
    { id: "pj-genealogy", url: "https://i.imgur.com/nb6U3lc.png", category: "project" },
    { id: "pj-rscorp", url: "https://i.imgur.com/oLamvh8.png", category: "project" },
    { id: "pj-cryptohunter", url: "https://i.imgur.com/Q6L1FMP.png", category: "project" },
    { id: "pj-ltol", url: "https://i.imgur.com/9lhAKW5.png", category: "project" },
    { id: "pj-supports", url: "https://i.imgur.com/nCP8gg8.png", category: "project" },
    { id: "pj-sss", url: "https://i.imgur.com/6FBWoGp.png", category: "project" },

    // Hobbies & Art
    { id: "hob-talent", url: "https://i.imgur.com/5Shgggo.png", category: "hobby" },
    { id: "hob-certs", url: "https://i.imgur.com/ubrY8Ox.jpeg", category: "hobby" },
    { id: "hob-guide", url: "https://i.imgur.com/z16HGq4.png", category: "hobby" },
    { id: "art-license1", url: "https://i.imgur.com/oxUXNu3.png", category: "artwork" },
    { id: "art-license2", url: "https://i.imgur.com/V691q2r.png", category: "artwork" },
    { id: "art-absolve1", url: "https://i.imgur.com/Gr1u7Qq.png", category: "artwork" },
    { id: "art-absolve2", url: "https://i.imgur.com/UUObjlX.png", category: "artwork" },

    // Travel
    { id: "trv-countries", url: "https://i.imgur.com/MrMSVCz.png", category: "travel" },
    { id: "trv-divetour", url: "https://i.imgur.com/7vFebfV.jpeg", category: "travel" },

    // Certificates
    { id: "cert-afi", url: "https://i.imgur.com/Ug9UdIt.png", category: "cert" },
    { id: "cert-aida", url: "/images/aida-instructor.png", category: "cert" },
    { id: "cert-blsd", url: "https://i.imgur.com/qpCviqY.png", category: "cert" },
    { id: "cert-cmas", url: "https://i.imgur.com/bjNwqy2.png", category: "cert" },
    { id: "cert-misc-dive", url: "https://i.imgur.com/OOoVMNK.png", category: "cert" },
    { id: "cert-opic", url: "https://i.imgur.com/ikvtDQr.png", category: "cert" },

    // Meta
    { id: "misc-flutter", url: "https://i.imgur.com/6koByeg.png", category: "misc" },
    { id: "misc-noai", url: "https://i.imgur.com/iw7lXVi.png", category: "misc" },
];

// 파생은 id 배열로만 — 표시명을 여기서 만들면 Provider 밖에서 로케일을 읽게 된다
const categories = [...new Set(galleryItems.map((item) => item.category))];

interface GalleryItemData {
  id: GalleryItemId;
  url: string;
  category: GalleryCategoryId;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface CategoryItemProps {
  label: string;
  item: GalleryItemData | undefined;
  onClick: () => void;
  variants: Variants;
}

function CategoryItem({ label, item, onClick, variants }: CategoryItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    // 타일은 진짜 <button>이어야 한다 — div+onClick이던 시절엔 키보드로 갤러리에
    // 진입할 방법 자체가 없었다. aria-label로 이름을 한 번만 주어, 대표 이미지의
    // alt와 라벨 span이 스크린리더에 두 번 읽히는 것을 막는다.
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-full cursor-pointer bg-gray-800 rounded-lg flex flex-col items-center justify-center aspect-square relative overflow-hidden group"
      variants={variants}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {item && (
        <Image
          src={item.url}
          alt={label}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${isLoaded ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {/* <button>은 phrasing content만 담을 수 있어 래퍼를 span으로 둔다 — flex는 클래스로 유지 */}
      <span className="z-10 flex flex-col items-center">
        <span className="text-white text-center font-bold drop-shadow-md text-xl">{label}</span>
      </span>
    </motion.button>
  );
}

interface GalleryImageItemProps {
  item: GalleryItemData;
  caption: string;
  index: number;
  onClick: () => void;
  variants: Variants;
}

function GalleryImageItem({ item, caption, index, onClick, variants }: GalleryImageItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setShouldLoad(false);
    const timer = window.setTimeout(() => setShouldLoad(true), Math.min(index * 85, 900));
    return () => window.clearTimeout(timer);
  }, [index, item.url]);

  return (
    // text-left는 버튼 기본 가운데 정렬을 되돌리기 위한 것 — div였을 때의 캡션 정렬을 유지한다.
    // data-gallery-tile: 라이트박스를 닫을 때 이 타일로 포커스를 되돌리기 위한 표식
    // (페이지의 data-dock-tab과 같은 방식). 부모가 자식 ref를 들고 있지 않아도 되게 한다.
    <motion.button
      type="button"
      data-gallery-tile={item.id}
      className="block w-full text-left bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
      aria-label={caption}
      variants={variants}
    >
      {/* <button> 안에는 phrasing content만 올 수 있다 — 레이아웃 박스는 span+block으로 만든다 */}
      <span className="block relative w-full aspect-square bg-gray-950">
        {shouldLoad && (
          <Image
            src={item.url}
            alt={caption}
            fill
            loading="lazy"
            decoding="async"
            quality={72}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIsLoaded(true)}
          />
        )}
      </span>
      <span className="block p-2">
        <span className="block text-gray-300 text-sm truncate">{caption}</span>
      </span>
    </motion.button>
  );
}

export default function GallerySection() {
  const { t } = useLanguage();
  // state에는 id만 담는다 — 표시 문자열을 담으면 언어 전환 시 필터가 깨지고,
  // 라이트박스는 옛 언어 캡션에 갇힌다
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategoryId | null>(null);
  const [selectedId, setSelectedId] = useState<GalleryItemId | null>(null);

  /**
   * 라이트박스가 떠 있는 동안의 키보드 주도권.
   *
   * Esc: 페이지(page.tsx)도 window에 Esc 리스너를 달아 섹션 전체를 닫는다. 이쪽 리스너는
   * selectedId가 생긴 뒤에야 등록되므로 같은 버블 단계에서는 언제나 페이지보다 늦게 불린다
   * — 즉 순서로는 이길 수 없다. 그래서 캡처 단계로 먼저 잡고 stopImmediatePropagation으로
   * 뒤따르는 리스너를 전부 끊는다(stopPropagation은 같은 노드에 걸린 리스너를 못 막는다).
   * 라이트박스가 열려 있을 때만 등록되니, 라이트박스가 없으면 Esc는 그대로 섹션을 닫는다.
   *
   * Tab: 이 다이얼로그 안에서 포커스를 받을 수 있는 건 오버레이 자신뿐이다. Tab을 막아
   * 뒤에 깔린 그리드로 포커스가 새는 것을 차단한다 — aria-modal이 한 약속을 실제로 지킨다.
   */
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      /*
       * 패널이 접히면 이 섹션은 언마운트되지 않고 display:none 안에 그대로 남는다(그게
       * 크롤러가 읽는 상태다). 그동안 라이트박스 state도 살아 있으므로, 보이지도 않는
       * 라이트박스가 Esc를 가로채는 일이 없도록 실제 렌더 여부를 확인하고 나서 개입한다.
       * position:fixed라 offsetParent는 항상 null이니 getClientRects로 판정한다.
       */
      const overlay = overlayRef.current;
      if (!overlay || overlay.getClientRects().length === 0) return;

      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setSelectedId(null);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        overlay.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selectedId]);

  /**
   * role="dialog"를 선언한 이상 포커스도 실제로 옮겨야 한다 — 열 때 오버레이로 들여보내고,
   * 닫을 때 열었던 타일로 돌려준다. 되돌릴 대상은 id로 기억한다: 타일은 부모가 ref를 들고
   * 있지 않고, 노드를 직접 붙들면 리렌더로 떨어져 나간 옛 DOM을 가리킬 수 있다.
   */
  const restoreTileIdRef = useRef<GalleryItemId | null>(null);
  useEffect(() => {
    if (selectedId) {
      restoreTileIdRef.current = selectedId;
      overlayRef.current?.focus({ preventScroll: true });
      return;
    }
    const tileId = restoreTileIdRef.current;
    if (tileId === null) return;
    restoreTileIdRef.current = null;
    document
      .querySelector<HTMLButtonElement>(`[data-gallery-tile="${tileId}"]`)
      ?.focus({ preventScroll: true });
  }, [selectedId]);

  const itemsToShow = selectedCategory
    ? galleryItems.filter(item => item.category === selectedCategory)
    : [];

  const selectedItem = selectedId
    ? galleryItems.find(item => item.id === selectedId)
    : undefined;

  if (selectedCategory) {
    return (
      <div className="p-4">
        <button onClick={() => setSelectedCategory(null)} className="mb-4 bg-gray-800 text-white py-2 px-4 rounded">
          &larr; {t.gallery.back}
        </button>
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
          {itemsToShow.map((item, index) => (
            <GalleryImageItem
              key={item.id}
              item={item}
              caption={t.gallery.captions[item.id]}
              index={index}
              onClick={() => setSelectedId(item.id)}
              variants={itemVariants}
            />
          ))}
        </motion.div>
        {selectedItem && (
          <div
            ref={overlayRef}
            // tabIndex=-1: Tab 순서에는 끼지 않지만 프로그램 포커스는 받는다 — 다이얼로그가
            // 열릴 때 포커스를 여기로 들여보내기 위한 최소 장치. focus:outline-none은 이
            // 프로그램 포커스가 테두리로 보이지 않게 한다(보이는 컨트롤이 아니므로).
            tabIndex={-1}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4 focus:outline-none"
            onClick={() => setSelectedId(null)}
            role="dialog"
            aria-modal="true"
            aria-label={t.gallery.captions[selectedItem.id]}
          >
            <div className="relative max-w-5xl w-full h-[75vh] flex items-center justify-center">
              <img src={selectedItem.url} alt={t.gallery.captions[selectedItem.id]} loading="lazy" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="mt-6 max-w-3xl text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-white text-lg font-medium bg-gray-900/80 px-6 py-3 rounded-xl backdrop-blur-sm border border-gray-700">{t.gallery.captions[selectedItem.id]}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-6">{t.gallery.title}</h2>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map((category) => {
          const firstItem = galleryItems.find((item) => item.category === category);
          return (
            <CategoryItem
              key={category}
              label={t.gallery.categories[category]}
              item={firstItem}
              onClick={() => setSelectedCategory(category)}
              variants={itemVariants}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
