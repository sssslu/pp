/**
 * ★ BGM 트랙별 설정의 단일 진입점 ★
 * 곡 하나의 모든 세부값(배경색·도형색·리플색·도형·볼륨 배율)이 여기 한 줄에 모여 있다.
 *
 * 새 곡 추가 방법:
 *  1. public/bgm/에 파일을 넣는다.
 *  2. 아래 TRACKS에 항목 하나를 추가한다 (키는 확장자를 뺀 파일명 소문자).
 *     등록이 없으면 DEFAULT_TRACK(랜덤 도형, gain 1)으로 재생된다.
 *  3. gain 측정: public/bgm/에서 아래 명령을 실행해 "input_i"(통합 LUFS)를 읽고,
 *       ffmpeg -hide_banner -i <파일> -af loudnorm=print_format=json -f null -
 *     gain = 10^((-14 - input_i) / 20)  (타깃 -14 LUFS, 스트리밍 표준)
 *  4. 새 도형이 필요하면 ascii/shapes.ts의 SHAPE_REGISTRY에 등록 후 shapeId로 지정.
 */

import type { VisualTheme } from "./ascii/events";

/** 곡 하나가 갖는 전체 설정: 시각 테마 + 볼륨 정규화 배율 */
export interface TrackConfig extends VisualTheme {
  /** 볼륨 정규화 배율. BASE_GAIN에 곱해진다 (1 = 원본 볼륨) */
  gain: number;
}

/** 전체 마스터 볼륨. BASE_GAIN × gain ≤ 1.0 이어야 클리핑이 없다 */
export const BASE_GAIN = 0.3;

export const TARGET_LUFS = -14;

/** 미등록 곡의 기본값 */
export const DEFAULT_TRACK: TrackConfig = {
  bg: "#06b6d4", shapeColor: "#ef4444", rippleColor: "#06b6d4", shapeId: "random", gain: 1,
};

// 측정일 2026-07-06 / ffmpeg loudnorm 통합 라우드니스:
// bgm1 -14.13, bgm2 -16.24, bgm3 -16.24, bgm4 -7.97, bgm5 -9.17, bgm6 -3.82
// bgm7 -17.39 (측정일 2026-07-11)
export const TRACKS: Record<string, TrackConfig> = {
  bgm1: { bg: "#0e7490", shapeColor: "#67e8f9", rippleColor: "#fb7185", shapeId: "random", gain: 1.1 },
  bgm2: { bg: "#4c1d95", shapeColor: "#f0abfc", rippleColor: "#22d3ee", shapeId: "random", gain: 1.35 },
  bgm3: { bg: "#14532d", shapeColor: "#bef264", rippleColor: "#fb7185", shapeId: "random", gain: 1.29 },
  bgm4: { bg: "#9f1239", shapeColor: "#fda4af", rippleColor: "#22d3ee", shapeId: "random", gain: 0.6 },
  // 요구사항: 5번 곡은 THE FINALS 'F' 로고 고정
  bgm5: { bg: "#6b7280", shapeColor: "#facc15", rippleColor: "#facc15", shapeId: "finalsLogo", gain: 0.8 },
  // 요구사항: 6번 곡은 병원 십자가 고정
  bgm6: { bg: "#e5e7eb", shapeColor: "#ef4444", rippleColor: "#ef4444", shapeId: "hospitalCross", gain: 0.5 },
  // 요구사항: 7번 곡은 블랙홀(Gargantua) 고정 — 장면 자체가 고정 팔레트라 색은 참고값
  bgm7: { bg: "#05060a", shapeColor: "#f59a34", rippleColor: "#ffbe6e", shapeId: "blackHole", gain: 1.48 },
};

export function getTrackConfig(fileName: string): TrackConfig {
  const key = fileName.toLowerCase().replace(/\.[^.]+$/, "");
  return TRACKS[key] ?? DEFAULT_TRACK;
}

export function getTrackTheme(fileName: string): VisualTheme {
  const { bg, shapeColor, rippleColor, shapeId } = getTrackConfig(fileName);
  return { bg, shapeColor, rippleColor, shapeId };
}

export function getTrackGain(fileName: string): number {
  return getTrackConfig(fileName).gain;
}
