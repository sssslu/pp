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

interface Star { x: number; y: number; r: number; a: number; warm: boolean; ph: number; }

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

/**
 * 인터스텔라 Gargantua 블랙홀을 레이어드 가법 그라디언트로 그린다. 모든 치수는 R(그림자 반경) 단위.
 * 와이어프레임이 아니라, 렌즈된 원반이 위/아래로 감기고 밝은 띠가 그림자 앞을 가로지르며
 * 얇은 광자 링이 테두리를 감싸는 실루엣을 합성한다.
 * 층: 헤이즈 · 위 아크 · 아래 아크 · 뒤 띠 · 그림자 · 광자 링 · 앞 띠 · 팁 · 도플러 · 블룸.
 */
function drawGargantua(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, t: number) {
  const TAU = Math.PI * 2;
  const BLOOM = 1, DOP = 1, MO = 1; // 절제된 모션: 사진처럼 거의 정지, 밝기만 미세하게 흐른다
  const breathe = 1 + 0.05 * MO * Math.sin((t * TAU) / 10);
  const hot = ((t * TAU) / 14) * MO;             // 광자 링 위를 도는 밝은 점(빔 피크)
  const flow = (t * R * 0.3 * MO) % (3 * R);     // 띠를 따라 흐르는 반짝임

  // 성능: 전체 캔버스가 아니라 블랙홀 바운딩 박스만 채운다
  const bx = cx - 3.7 * R, by = cy - 3.7 * R, bw = 7.4 * R, bh = 7.4 * R;
  const box = () => ctx.fillRect(bx, by, bw, bh);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // 1. 따뜻한 주변 헤이즈
  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, 3.5 * R);
  haze.addColorStop(0, `rgba(255,150,54,${0.13 * BLOOM})`);
  haze.addColorStop(0.5, `rgba(200,90,27,${0.05 * BLOOM})`);
  haze.addColorStop(1, "rgba(200,90,27,0)");
  ctx.fillStyle = haze; box();

  const crescent = (rxI: number, ryI: number, rxO: number, ryO: number, a0: number, a1: number) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rxO, ryO, 0, a0, a1);
    ctx.ellipse(cx, cy, rxI, ryI, 0, a1, a0, true);
    ctx.closePath();
  };
  const ramp = (rIn: number, rOut: number, stops: [number, string][]) => {
    const g = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut);
    for (const [s, c] of stops) g.addColorStop(s, c);
    return g;
  };
  const bandFill = (reach: number, halfT: number, yc: number, stops: [number, string][], aMul = 1) => {
    ctx.beginPath();
    ctx.moveTo(cx - reach, cy + yc);
    ctx.quadraticCurveTo(cx, cy + yc - halfT, cx + reach, cy + yc);
    ctx.quadraticCurveTo(cx, cy + yc + halfT, cx - reach, cy + yc);
    ctx.closePath();
    const lg = ctx.createLinearGradient(cx - reach, cy, cx + reach, cy);
    for (const [s, c] of stops) lg.addColorStop(s, c);
    ctx.globalAlpha = aMul * breathe;
    ctx.fillStyle = lg; ctx.fill();
    ctx.globalAlpha = 1;
  };

  // 2. 위로 감긴 렌즈 아크 — 넓은 외곽 글로우 + 그림자 위를 또렷하게 감싸는 밝은 안쪽 테
  ctx.globalAlpha = breathe;
  crescent(1.02 * R, 1.0 * R, 1.66 * R, 1.58 * R, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fillStyle = ramp(1.0 * R, 1.66 * R, [
    [0, "rgba(255,236,182,0.5)"], [0.3, "rgba(245,170,80,0.34)"], [1, "rgba(110,42,12,0)"],
  ]);
  ctx.fill();
  crescent(1.02 * R, 1.0 * R, 1.34 * R, 1.28 * R, Math.PI * 1.06, Math.PI * 1.94);
  ctx.fillStyle = ramp(1.0 * R, 1.34 * R, [
    [0, "rgba(255,246,220,0.9)"], [0.5, "rgba(255,198,112,0.62)"], [1, "rgba(235,120,40,0)"],
  ]);
  ctx.fill();

  // 3. 아래로 감긴 아크 — 위와 같되 ~15% 어둡게 (넓은 글로우 + 밝은 안쪽 테)
  crescent(1.02 * R, 1.0 * R, 1.5 * R, 1.44 * R, Math.PI * 0.14, Math.PI * 0.86);
  ctx.fillStyle = ramp(1.0 * R, 1.5 * R, [
    [0, "rgba(255,207,135,0.42)"], [0.42, "rgba(232,104,24,0.28)"], [1, "rgba(110,42,12,0)"],
  ]);
  ctx.fill();
  crescent(1.02 * R, 1.0 * R, 1.28 * R, 1.22 * R, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fillStyle = ramp(1.0 * R, 1.28 * R, [
    [0, "rgba(255,232,168,0.7)"], [0.5, "rgba(245,150,60,0.46)"], [1, "rgba(235,120,40,0)"],
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 4. 뒤쪽 수평 원반 띠 (양옆 뒤에서 나와 ±3.5R까지 뻗는다) — 곧 그림자가 가운데를 가린다
  bandFill(3.5 * R, 0.22 * R, 0, [
    [0, "rgba(200,90,27,0)"], [0.26, "rgba(232,104,24,0.4)"],
    [0.5, "rgba(255,217,160,0.72)"], [0.74, "rgba(232,104,24,0.4)"], [1, "rgba(200,90,27,0)"],
  ]);

  // 5. 그림자 (순수 검정) — 아크·뒤 띠의 가운데를 잘라 고리로 만든다
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 1.0 * R, 0.95 * R, 0, 0, TAU);
  ctx.fillStyle = "#000000"; ctx.fill();

  // 6. 광자 링 — 가장 얇고 밝은 테두리 (부드러운 패스 + 얇은 코어 + 도는 밝은 점)
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath(); ctx.ellipse(cx, cy, 1.045 * R, 0.995 * R, 0, 0, TAU);
  ctx.lineWidth = 0.06 * R; ctx.strokeStyle = "rgba(255,225,160,0.3)";
  ctx.shadowBlur = 0.16 * R; ctx.shadowColor = "rgba(255,228,170,0.8)"; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, 1.03 * R, 0.98 * R, 0, 0, TAU);
  ctx.lineWidth = Math.max(1, 0.02 * R); ctx.strokeStyle = "rgba(255,251,240,0.96)";
  ctx.shadowBlur = 0.07 * R; ctx.stroke();
  const ha = hot % TAU;
  ctx.beginPath(); ctx.ellipse(cx, cy, 1.03 * R, 0.98 * R, 0, ha - 0.28, ha + 0.28);
  ctx.lineWidth = 0.028 * R; ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.shadowBlur = 0.1 * R; ctx.stroke();
  ctx.shadowBlur = 0;

  // 7. 앞쪽 띠 — 그림자 앞을 가로지르는 밝은 막대 (중심보다 살짝 아래)
  bandFill(2.8 * R, 0.16 * R, 0.08 * R, [
    [0, "rgba(245,154,52,0)"], [0.3, "rgba(245,154,52,0.5)"],
    [0.5, "rgba(255,207,135,0.9)"], [0.7, "rgba(245,154,52,0.5)"], [1, "rgba(245,154,52,0)"],
  ]);
  bandFill(2.6 * R, 0.05 * R, 0.08 * R, [
    [0, "rgba(255,246,230,0)"], [0.4, "rgba(255,246,230,0.85)"],
    [0.5, "rgba(255,252,246,0.98)"], [0.6, "rgba(255,246,230,0.85)"], [1, "rgba(255,246,230,0)"],
  ]);

  // 8. 접선 방향으로 흐르는 미세한 반짝임
  const sx = cx - 1.5 * R + flow;
  const shimmer = ctx.createRadialGradient(sx, cy + 0.08 * R, 0, sx, cy + 0.08 * R, 0.75 * R);
  shimmer.addColorStop(0, `rgba(255,246,230,${0.16 * MO})`);
  shimmer.addColorStop(1, "rgba(255,246,230,0)");
  ctx.fillStyle = shimmer; box();

  // 9. 팁 매듭 — 왼쪽(다가오는 쪽)이 더 뜨겁고 크다
  const knot = (kx: number, scale: number, alpha: number) => {
    const kg = ctx.createRadialGradient(kx, cy, 0, kx, cy, 0.4 * R * scale);
    kg.addColorStop(0, `rgba(255,232,182,${alpha})`);
    kg.addColorStop(1, "rgba(255,232,182,0)");
    ctx.fillStyle = kg; box();
  };
  knot(cx - 1.2 * R, 1 + 0.18 * DOP, 0.48 * (1 + 0.12 * DOP));
  knot(cx + 1.2 * R, 1, 0.4);

  // 10. 도플러 — 왼쪽 더 밝고 희게, 오른쪽 살짝 어둡고 붉게 (영화처럼 절제)
  const dl = ctx.createRadialGradient(cx - 1.55 * R, cy, 0, cx - 1.55 * R, cy, 1.8 * R);
  dl.addColorStop(0, `rgba(255,253,246,${0.12 * DOP})`);
  dl.addColorStop(1, "rgba(255,253,246,0)");
  ctx.fillStyle = dl; box();
  ctx.globalCompositeOperation = "source-over";
  const dr = ctx.createRadialGradient(cx + 1.6 * R, cy, 0, cx + 1.6 * R, cy, 1.7 * R);
  dr.addColorStop(0, `rgba(12,5,0,${0.11 * DOP})`);
  dr.addColorStop(1, "rgba(12,5,0,0)");
  ctx.fillStyle = dr; box();

  // 11. 전역 블룸
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 3 * R);
  glow.addColorStop(0, `rgba(255,243,222,${0.05 * BLOOM * breathe})`);
  glow.addColorStop(1, "rgba(255,243,222,0)");
  ctx.fillStyle = glow; box();

  ctx.restore();
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

    // 블랙홀(Gargantua) 배경의 별. 리사이즈 때만 다시 뿌린다.
    let stars: Star[] = [];
    const seedStars = () => {
      const n = Math.round((viewW * viewH) / 10000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        r: Math.random() * 0.9 + 0.3,
        a: Math.random() * 0.5 + 0.12,
        warm: Math.random() < 0.18,
        ph: Math.random() * Math.PI * 2,
      }));
    };

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

    // 패턴은 캔버스 원점에 고정되므로, 격자에 맞춘 오프셋 교체로 깜빡임을 흉내낸다.
    let tileIdx = 0;
    let offX = 0;
    let offY = 0;
    let lastFlickerAt = 0;
    const updateFlicker = (now: number) => {
      if (now - lastFlickerAt < BACKGROUND_FLICKER_INTERVAL_MS) return;
      lastFlickerAt = now;
      tileIdx = Math.floor(Math.random() * 64);
      offX = Math.floor(Math.random() * TILE_CELLS) * CELL;
      offY = Math.floor(Math.random() * TILE_CELLS) * CELL;
    };

    const patternTransform = () =>
      new DOMMatrix().translateSelf(offX, offY).scaleSelf(1 / dpr);

    const resize = () => {
      const nextDpr = window.devicePixelRatio || 1;
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
      seedStars();
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
    });

    const ripples: Ripple[] = [];
    const offRipple = onRipple((detail) => {
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

    const fillBackground = (now: number) => {
      const bgPatterns = getPatterns("noise", bgColor);
      const pattern = bgPatterns[tileIdx % bgPatterns.length];
      pattern.setTransform(patternTransform());

      if (prevBgColor) {
        const t = (now - fadeStart) / COLOR_FADE_MS;
        if (t >= 1) {
          prevBgColor = null;
        } else {
          const prevPatterns = getPatterns("noise", prevBgColor);
          const prevPattern = prevPatterns[tileIdx % prevPatterns.length];
          prevPattern.setTransform(patternTransform());
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
      pattern.setTransform(patternTransform());

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

    // 블랙홀일 때: 트랙 노이즈 대신 어두운 우주 + 별을 깔고 Gargantua를 그린 뒤 비네트로 감싼다.
    const drawGargantuaScene = (now: number) => {
      const t = now / 1000;
      const cx = viewW / 2, cy = viewH / 2;
      const R = Math.min(viewW, viewH) * 0.16;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, viewW, viewH);
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4 * R);
      haze.addColorStop(0, "rgba(40,20,10,0.22)");
      haze.addColorStop(1, "rgba(40,20,10,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, viewW, viewH);

      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t + s.ph));
        ctx.fillStyle = s.warm ? "#ffe1b8" : "#cfd6e6";
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;

      drawGargantua(ctx, cx, cy, R, t);

      ctx.globalCompositeOperation = "source-over";
      const vig = ctx.createRadialGradient(
        cx, cy, Math.min(viewW, viewH) * 0.35, cx, cy, Math.max(viewW, viewH) * 0.75,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, viewW, viewH);
    };

    const strokeRipples = (time: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (time - ripples[i].birth > ripples[i].life) ripples.splice(i, 1);
      }
      for (const ripple of ripples) {
        const front = (time - ripple.birth) * ripple.speed;
        const glyphPatterns = getPatterns("glyph", ripple.color);
        const pattern = glyphPatterns[tileIdx % glyphPatterns.length];
        pattern.setTransform(patternTransform());

        ctx.beginPath();
        if (front <= ripple.band) {
          ctx.fillStyle = pattern;
          ctx.arc(ripple.x, ripple.y, front + ripple.band, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = pattern;
          ctx.lineWidth = ripple.band * 2;
          ctx.arc(ripple.x, ripple.y, front, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const draw = (now: number) => {
      const time = now / 1000;
      ctx.clearRect(0, 0, viewW, viewH);
      if (activeShape.gargantua) {
        drawGargantuaScene(now);
      } else {
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
