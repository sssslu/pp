/**
 * ASCII 배경과 나머지 UI가 통신하는 커스텀 이벤트 계약.
 * 문자열 이벤트명을 직접 쓰지 말고 반드시 이 모듈의 헬퍼를 사용할 것.
 */

import type { ShapeId } from "./shapes";

export const THEME_EVENT = "bgm-visual-track";
export const RIPPLE_EVENT = "ascii-ripple";

/** 곡 하나가 화면에 입히는 시각 테마 */
export interface VisualTheme {
  /** 배경 노이즈 색 */
  bg: string;
  /** 중앙 도형 색 */
  shapeColor: string;
  /** 리플 기본 색 */
  rippleColor: string;
  /** 중앙 도형. "random"이면 랜덤 풀에서 선택 */
  shapeId: ShapeId | "random";
}

export interface ThemeEventDetail extends VisualTheme {
  /** true면 크로스페이드로 전환 (곡 넘김), false면 즉시 적용 (첫 재생) */
  transition: boolean;
}

export interface RippleEventDetail {
  x: number;
  y: number;
  /** 밴드 두께(px). 지정 없으면 thin 여부로 기본값 결정 */
  band?: number;
  thin?: boolean;
  /** 지정 없으면 현재 테마의 rippleColor */
  color?: string;
}

export function dispatchVisualTheme(detail: ThemeEventDetail) {
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail }));
}

export function dispatchRipple(detail: RippleEventDetail) {
  window.dispatchEvent(new CustomEvent(RIPPLE_EVENT, { detail }));
}

export function onVisualTheme(handler: (detail: ThemeEventDetail) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<ThemeEventDetail>).detail);
  window.addEventListener(THEME_EVENT, listener);
  return () => window.removeEventListener(THEME_EVENT, listener);
}

export function onRipple(handler: (detail: RippleEventDetail) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<RippleEventDetail>).detail);
  window.addEventListener(RIPPLE_EVENT, listener);
  return () => window.removeEventListener(RIPPLE_EVENT, listener);
}
