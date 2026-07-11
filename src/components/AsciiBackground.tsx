"use client";

import { useEffect, useRef } from "react";
import {
  SHAPE_REGISTRY,
  RANDOM_SHAPE_POOL,
  randomShapeId,
  randomRotation,
  projectShape,
  type Segment,
  type ShapeDef,
  type ShapeId,
} from "@/lib/ascii/shapes";
import { onVisualTheme, onRipple } from "@/lib/ascii/events";
import {
  seedGargantua,
  seedStars,
  seedNebulas,
  drawGargantuaScene,
  type Star,
  type Nebula,
} from "@/lib/ascii/gargantua";
import { DEFAULT_TRACK } from "@/lib/bgmTracks";

/**
 * 아스키 글자를 픽셀 삼아 배경 노이즈 + 중앙 3D 도형 + 클릭 리플을 그리는 캔버스.
 *
 * 성능 노트: 글자를 매 프레임 fillText로 찍지 않는다. 글자들을 타일 캔버스에
 * 미리 구워 CanvasPattern으로 만들고, 배경은 fillRect 한 번, 도형·리플은
 * 패턴 스트로크로 그린다. 깜빡임은 타일 변형 + 격자 단위 오프셋 교체로 재현.
 */

const BUBBLE_CHARS = ["0", "1", "0", "1", "0", "1", " ", " ", ".", ":", "|", "-", "+", "/", "\\"];
const BG_CHARS     = ["0", "1", "0", "1", " ", " ", " ", ".", " ", "0", "1", " ", "/", ":"];

const CELL = 6;
const BACKGROUND_FLICKER_INTERVAL_MS = 70;
const BACKGROUND_ALPHA_MULT = 0.8;
const BACKGROUND_ALPHA_MAX  = 0.4;

const CENTER_SHAPE_MIN   = 360;
const CENTER_SHAPE_MAX   = 680;
const CENTER_SHAPE_RATIO = 0.62;

const RIPPLE_BAND_THICK = 180;
const RIPPLE_BAND_THIN  = 25;
const RIPPLE_SPEED      = 600;
/**
 * 동시에 살아있는 리플 상한 — 순수 안전망. 정상 사용으로는 도달 불가한 값이라
 * (미니 리플 스로틀 160ms × 최대 수명 ~4초 ≈ 26개 + 롱프레스 몇 개) 보이는 변화가 없다.
 */
const MAX_RIPPLES       = 40;

const TILE_CELLS          = 64;
const NOISE_TILE_VARIANTS = 5;
const GLYPH_TILE_VARIANTS = 3;
const COLOR_FADE_MS       = 450;

interface Ripple {
  x: number;
  y: number;
  birth: number;
  speed: number;
  band: number;
  life: number;
  color: string;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTile(color: string, dpr: number, kind: "noise" | "glyph"): HTMLCanvasElement {
  const sizePx = TILE_CELLS * CELL;
  const tile = document.createElement("canvas");
  tile.width = Math.round(sizePx * dpr);
  tile.height = Math.round(sizePx * dpr);
  const tctx = tile.getContext("2d")!;
  tctx.scale(dpr, dpr);
  tctx.font = `${CELL}px monospace`;
  tctx.textBaseline = "top";
  tctx.fillStyle = color;

  for (let row = 0; row < TILE_CELLS; row++) {
    for (let col = 0; col < TILE_CELLS; col++) {
      if (kind === "noise") {
        if (Math.random() < 0.22) continue;
        const ch = randItem(BG_CHARS);
        if (ch === " ") continue;
        tctx.globalAlpha = Math.min(
          BACKGROUND_ALPHA_MAX,
          (Math.random() * 0.22 + 0.06) * BACKGROUND_ALPHA_MULT,
        );
        tctx.fillText(ch, col * CELL, row * CELL);
      } else {
        const ch = randItem(BUBBLE_CHARS);
        if (ch === " ") continue;
        tctx.globalAlpha = 1;
        tctx.fillText(ch, col * CELL, row * CELL);
      }
    }
  }
  return tile;
}

export default function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let bgColor = DEFAULT_TRACK.bg;
    let shapeColor = DEFAULT_TRACK.shapeColor;
    let rippleColor = DEFAULT_TRACK.rippleColor;
    let prevBgColor: string | null = null;
    let fadeStart = 0;
    let viewW = 0;
    let viewH = 0;
    let dpr = 1;
    let centerShapeRadius = 0;

    let activeShapeId: ShapeId = randItem(RANDOM_SHAPE_POOL);
    let activeShape: ShapeDef = SHAPE_REGISTRY[activeShapeId];
    let rotation = randomRotation();

    // 블랙홀(Gargantua) 배경의 별가루·성운. 리사이즈 때 dirty로 표시만 하고,
    // 실제 씨딩은 블랙홀이 그려지는 프레임에서만 한다 — 다른 테마 중의 리사이즈
    // 폭주(모바일 주소창 등)에 ~1200개 객체를 헛되이 만들지 않기 위함.
    let stars: Star[] = [];
    let nebulas: Nebula[] = [];
    let starsDirty = true;
    // 강착원반/헤일로/광자 링/가루 입자는 R 단위라 한 번만 생성한다 (리사이즈 무관).
    const gargantua = seedGargantua();

    const setShape = (id: ShapeId | "random") => {
      const next = id === "random" ? randomShapeId(activeShapeId) : id;
      if (next === activeShapeId) return;
      activeShapeId = next;
      activeShape = SHAPE_REGISTRY[next];
      rotation = randomRotation();
    };

    // 색상별 패턴 캐시 (dpr이 바뀌면 통째로 재생성)
    const patternCache = new Map<string, CanvasPattern[]>();
    const getPatterns = (kind: "noise" | "glyph", color: string): CanvasPattern[] => {
      const key = `${kind}:${color}`;
      let patterns = patternCache.get(key);
      if (!patterns) {
        const count = kind === "noise" ? NOISE_TILE_VARIANTS : GLYPH_TILE_VARIANTS;
        patterns = Array.from({ length: count }, () =>
          ctx.createPattern(buildTile(color, dpr, kind), "repeat")!
        );
        patternCache.set(key, patterns);
      }
      return patterns;
    };

    // 리플 색 패턴을 미리(브라우저가 한가할 때) 구워 둔다 — 안 그러면 첫 클릭 프레임에서
    // 타일 3장을 한꺼번에 구우며 눈에 띄는 랙이 생긴다. 이미 캐시돼 있으면 즉시 반환된다.
    let warmId: number | null = null;
    let warmIsIdle = false;
    const warmRipplePatterns = () => {
      if (warmId !== null) return; // 이미 예약됨 — 실행 시점의 최신 rippleColor를 굽는다
      const build = () => {
        warmId = null;
        getPatterns("glyph", rippleColor);
      };
      if (typeof window.requestIdleCallback === "function") {
        warmIsIdle = true;
        warmId = window.requestIdleCallback(build, { timeout: 1500 });
      } else {
        warmIsIdle = false;
        warmId = window.setTimeout(build, 150);
      }
    };
    const cancelWarm = () => {
      if (warmId === null) return;
      if (warmIsIdle) window.cancelIdleCallback(warmId);
      else clearTimeout(warmId);
      warmId = null;
    };

    // 패턴은 캔버스 원점에 고정되므로, 격자에 맞춘 오프셋 교체로 깜빡임을 흉내낸다.
    let tileIdx = 0;
    let offX = 0;
    let offY = 0;
    let lastFlickerAt = 0;

    // 패턴 변환 행렬은 하나를 재사용한다 — 값은 플리커 틱(70ms)과 리사이즈 때만 바뀌는데
    // 매 프레임 패턴마다 DOMMatrix를 새로 만들면 그리기 루프에 GC 부담만 쌓인다.
    // (setTransform은 호출 시점에 행렬 값을 복사하므로 공유 객체를 넘겨도 안전하다)
    const patternMatrix = new DOMMatrix();
    let patternGen = 0;
    const appliedGen = new WeakMap<CanvasPattern, number>();
    const updatePatternMatrix = () => {
      patternMatrix.a = patternMatrix.d = 1 / dpr;
      patternMatrix.e = offX;
      patternMatrix.f = offY;
      patternGen++;
    };
    /** 같은 세대의 변환이 이미 적용된 패턴이면 setTransform을 건너뛴다 */
    const applyPatternTransform = (p: CanvasPattern) => {
      if (appliedGen.get(p) === patternGen) return;
      p.setTransform(patternMatrix);
      appliedGen.set(p, patternGen);
    };

    const updateFlicker = (now: number) => {
      if (now - lastFlickerAt < BACKGROUND_FLICKER_INTERVAL_MS) return;
      lastFlickerAt = now;
      tileIdx = Math.floor(Math.random() * 64);
      offX = Math.floor(Math.random() * TILE_CELLS) * CELL;
      offY = Math.floor(Math.random() * TILE_CELLS) * CELL;
      updatePatternMatrix();
    };

    const resize = () => {
      const nextDpr = window.devicePixelRatio || 1;
      // 크기·dpr이 그대로면 아무것도 안 한다 — canvas.width 대입만으로도 비트맵이
      // 리셋되므로, 중복 resize 이벤트(모바일 브라우저 등)에서 헛일을 막는다.
      if (nextDpr === dpr && window.innerWidth === viewW && window.innerHeight === viewH) return;
      if (nextDpr !== dpr) {
        dpr = nextDpr;
        patternCache.clear();
      }
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerShapeRadius = Math.min(CENTER_SHAPE_MAX, Math.max(CENTER_SHAPE_MIN, viewW * CENTER_SHAPE_RATIO)) / 2;
      starsDirty = true;
      updatePatternMatrix();
      warmRipplePatterns();
    };

    const offTheme = onVisualTheme((theme) => {
      if (theme.bg !== bgColor && theme.transition) {
        prevBgColor = bgColor;
        fadeStart = performance.now();
      } else if (theme.bg !== bgColor) {
        prevBgColor = null;
      }
      bgColor = theme.bg;
      shapeColor = theme.shapeColor;
      rippleColor = theme.rippleColor;
      setShape(theme.shapeId);
      warmRipplePatterns();
      scheduleEvict();
    });

    const ripples: Ripple[] = [];
    const offRipple = onRipple((detail) => {
      // 상한 초과 시 가장 오래된 리플을 버린다 (정상 사용에선 도달하지 않는 안전망)
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      const band = detail.band ?? (detail.thin ? RIPPLE_BAND_THIN : RIPPLE_BAND_THICK);
      const dx = Math.max(detail.x, viewW - detail.x);
      const dy = Math.max(detail.y, viewH - detail.y);
      const maxDist = Math.sqrt(dx * dx + dy * dy) + band;
      ripples.push({
        x: detail.x,
        y: detail.y,
        birth: performance.now() / 1000,
        speed: RIPPLE_SPEED,
        band,
        life: maxDist / RIPPLE_SPEED + 0.1,
        color: detail.color ?? rippleColor,
      });
    });

    // 테마 전환이 끝난 뒤, 더 이상 쓰지 않는 색의 패턴 타일을 비운다 — 트랙을 순환하며
    // 방문한 색이 전부 캐시에 눌러앉으면 수백 MB까지 자랄 수 있다. 살아있는 색(현재 테마,
    // 페이드 중인 이전 배경, 화면에 남은 리플의 색)은 남기므로 보이는 변화가 없다.
    let evictId: number | null = null;
    const evictStalePatterns = () => {
      evictId = null;
      const live = new Set([`noise:${bgColor}`, `glyph:${shapeColor}`, `glyph:${rippleColor}`]);
      if (prevBgColor) live.add(`noise:${prevBgColor}`);
      for (const r of ripples) live.add(`glyph:${r.color}`);
      for (const key of patternCache.keys()) {
        if (!live.has(key)) patternCache.delete(key);
      }
    };
    const scheduleEvict = () => {
      if (evictId !== null) clearTimeout(evictId);
      evictId = window.setTimeout(evictStalePatterns, COLOR_FADE_MS + 100);
    };

    const fillBackground = (now: number) => {
      const bgPatterns = getPatterns("noise", bgColor);
      const pattern = bgPatterns[tileIdx % bgPatterns.length];
      applyPatternTransform(pattern);

      if (prevBgColor) {
        const t = (now - fadeStart) / COLOR_FADE_MS;
        if (t >= 1) {
          prevBgColor = null;
        } else {
          const prevPatterns = getPatterns("noise", prevBgColor);
          const prevPattern = prevPatterns[tileIdx % prevPatterns.length];
          applyPatternTransform(prevPattern);
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = prevPattern;
          ctx.fillRect(0, 0, viewW, viewH);
          ctx.globalAlpha = t;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, viewW, viewH);
          ctx.globalAlpha = 1;
          return;
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, viewW, viewH);
    };

    const strokeShape = (time: number) => {
      const radius = centerShapeRadius * (activeShape.scale ?? 1);
      const { main, accent } = projectShape(
        activeShape, time, viewW / 2, viewH / 2, radius, rotation,
      );
      const glyphPatterns = getPatterns("glyph", shapeColor);
      const pattern = glyphPatterns[tileIdx % glyphPatterns.length];
      applyPatternTransform(pattern);

      const baseW = Math.max(CELL * 0.5, radius * 0.035) * 2;
      ctx.strokeStyle = pattern;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const strokeSegments = (segs: Segment[], width: number) => {
        if (!segs.length) return;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of segs) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      };
      strokeSegments(main, baseW * (activeShape.edgeScale ?? 1));
      strokeSegments(accent, baseW * 0.85);
    };

    const strokeRipples = (time: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (time - ripples[i].birth > ripples[i].life) ripples.splice(i, 1);
      }
      // 같은 색 리플(대부분의 경우)은 패턴 해석/변환을 한 번만 한다
      let lastColor: string | null = null;
      let pattern: CanvasPattern | null = null;
      for (const ripple of ripples) {
        const front = (time - ripple.birth) * ripple.speed;
        if (ripple.color !== lastColor) {
          const glyphPatterns = getPatterns("glyph", ripple.color);
          pattern = glyphPatterns[tileIdx % glyphPatterns.length];
          applyPatternTransform(pattern);
          lastColor = ripple.color;
        }
        ctx.beginPath();
        if (front <= ripple.band) {
          ctx.fillStyle = pattern!;
          ctx.arc(ripple.x, ripple.y, front + ripple.band, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = pattern!;
          ctx.lineWidth = ripple.band * 2;
          ctx.arc(ripple.x, ripple.y, front, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const draw = (now: number) => {
      const time = now / 1000;
      if (activeShape.gargantua) {
        // 씨딩은 실제로 그려지는 첫 프레임으로 미룬다 (리사이즈 낭비 방지)
        if (starsDirty) {
          stars = seedStars(viewW, viewH);
          nebulas = seedNebulas(viewW, viewH);
          starsDirty = false;
        }
        // 블랙홀은 자체 우주 배경(성운·별가루·별똥별)을 포함해 고정 팔레트로 그린다.
        // 장면이 캔버스 전체를 불투명하게 덮으므로 clearRect가 필요 없다.
        drawGargantuaScene(ctx, viewW, viewH, now, gargantua, stars, nebulas);
      } else {
        ctx.clearRect(0, 0, viewW, viewH);
        fillBackground(now);
        strokeShape(time);
      }
      strokeRipples(time);
    };

    let rafId: number;
    const loop = () => {
      const now = performance.now();
      updateFlicker(now);
      draw(now);
      rafId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      cancelWarm();
      if (evictId !== null) clearTimeout(evictId);
      offTheme();
      offRipple();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
