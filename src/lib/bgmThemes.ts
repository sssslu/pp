/**
 * BGM 트랙 → 시각 테마 매핑.
 *
 * 새 곡 테마 추가 방법: public/bgm/에 파일을 넣고 여기에 항목 하나만 추가하면 된다.
 * 키는 확장자를 뺀 파일명 소문자. 등록이 없으면 DEFAULT_THEME(랜덤 도형)이 쓰인다.
 */

import type { VisualTheme } from "./ascii/events";

export const DEFAULT_THEME: VisualTheme = {
  bg: "#06b6d4",
  shapeColor: "#ef4444",
  rippleColor: "#06b6d4",
  shapeId: "random",
};

export const TRACK_THEMES: Record<string, VisualTheme> = {
  // 도형 고정은 bgm5/bgm6만. 나머지 곡은 곡이 바뀔 때마다 랜덤 풀에서 새로 뽑는다.
  bgm1: { bg: "#0e7490", shapeColor: "#67e8f9", rippleColor: "#fb7185", shapeId: "random" },
  bgm2: { bg: "#4c1d95", shapeColor: "#f0abfc", rippleColor: "#22d3ee", shapeId: "random" },
  bgm3: { bg: "#14532d", shapeColor: "#bef264", rippleColor: "#fb7185", shapeId: "random" },
  bgm4: { bg: "#9f1239", shapeColor: "#fda4af", rippleColor: "#22d3ee", shapeId: "random" },
  // 요구사항: 5번 곡은 THE FINALS 'F' 로고 고정
  bgm5: { bg: "#6b7280", shapeColor: "#facc15", rippleColor: "#facc15", shapeId: "finalsLogo" },
  // 요구사항: 6번 곡은 병원 십자가 고정
  bgm6: { bg: "#e5e7eb", shapeColor: "#ef4444", rippleColor: "#ef4444", shapeId: "hospitalCross" },
};

export function getTrackTheme(fileName: string): VisualTheme {
  const key = fileName.toLowerCase().replace(/\.[^.]+$/, "");
  return TRACK_THEMES[key] ?? DEFAULT_THEME;
}
