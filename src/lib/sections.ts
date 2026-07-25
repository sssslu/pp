/**
 * 섹션 레지스트리 — 이 사이트에 어떤 섹션이 어떤 순서로 있는지에 대한 단일 진실.
 *
 * 예전엔 '갤러리 탭'이라는 사실이 page.tsx의 pages 배열 위치, 로케일의 tabs 튜플 위치,
 * isGalleryTab === 4 세 곳에 '위치'로만 인코딩돼 있었다. 한 곳만 어긋나도 조용히 깨진다.
 * 라벨은 여기 두지 않는다 — 번역은 로케일 파일이 진실이고, 인덱스로 t.tabs와 맞물린다.
 */
import type { Translations } from "@/i18n/locales/ko";

export type SectionId = "about" | "perk" | "projects" | "hobby" | "gallery";

export interface SectionDef {
  id: SectionId;
  /**
   * 섹션 바깥 '액자'를 두를지 여부. false면 상단 페이드 마스크·ContactFooter·조회수를
   * 모두 생략한다 — 갤러리는 자체 그리드와 라이트박스로 화면을 꽉 채우기 때문.
   */
  framed: boolean;
}

/** t.tabs와 길이가 어긋나면 여기서 컴파일이 깨진다 — 두 곳 동기화의 유일한 안전장치 */
type SameLengthAs<T extends readonly unknown[], V> = { [K in keyof T]: V };

export const SECTIONS: SameLengthAs<Translations["tabs"], SectionDef> = [
  { id: "about",    framed: true  },
  { id: "perk",     framed: true  },
  { id: "projects", framed: true  },
  { id: "hobby",    framed: true  },
  { id: "gallery",  framed: false },
];

/** 도크 버튼의 aria-controls와 패널의 id가 가리키는 같은 값 */
export const SECTION_PANEL_ID = "section-panel";
