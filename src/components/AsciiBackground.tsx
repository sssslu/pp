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

interface Star { x: number; y: number; a: number; ph: number; }

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

// ── 블랙홀(인터스텔라 Gargantua)을 아스키 글리프로 렌더링 ──────────────
// 다른 도형처럼 글자로 그린다. 강착원반은 기울어진 평면을 도는 수천 개의 글리프이며,
// 안쪽 고리가 더 빠르게 돌고(케플러 차등회전), 다가오는 쪽이 밝고(도플러), 빛은 그림자
// 위로 휘어 헤일로/광자 링이 된다. 모든 반경은 R(그림자 반경) 단위.
const WARM = ["#7a300f", "#b5501a", "#e86818", "#f59a34", "#ffbe6e", "#ffe0ad", "#fff4e0"];
const GLYPH_RAMP = [".", ":", "+", "*", "o", "O", "0", "@"];
const rampChar = (b: number) =>
  GLYPH_RAMP[Math.max(0, Math.min(GLYPH_RAMP.length - 1, Math.floor(b * GLYPH_RAMP.length)))];

interface DiskP { rr: number; phi: number; j: number; }
interface OrbitP { rr: number; ang: number; tw: number; }
interface GargantuaParticles { disk: DiskP[]; halo: OrbitP[]; ring: OrbitP[]; }

function seedGargantua(): GargantuaParticles {
  const disk: DiskP[] = Array.from({ length: 1700 }, () => {
    const u = Math.random();
    return { rr: 1.1 + (3.4 - 1.1) * Math.pow(u, 1.4), phi: Math.random() * Math.PI * 2, j: Math.random() };
  });
  const halo: OrbitP[] = Array.from({ length: 620 }, () => {
    const u = Math.random();
    return { rr: 1.05 + (1.34 - 1.05) * Math.pow(u, 2.1), ang: Math.random() * Math.PI * 2, tw: Math.random() * Math.PI * 2 };
  });
  const ring: OrbitP[] = Array.from({ length: 300 }, (_, i) => ({
    ang: (i / 300) * Math.PI * 2, rr: 1.015 + Math.random() * 0.05, tw: Math.random() * Math.PI * 2,
  }));
  return { disk, halo, ring };
}

const GARGANTUA_SPIN = 3;    // 자전 속도 배율 — 고속
const GARGANTUA_TILT = 1.44; // 화면 경사(rad). π/2≈edge-on, 여기선 살짝 기울어짐

function drawGargantua(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, t: number, P: GargantuaParticles) {
  const TAU = Math.PI * 2;
  const cosI = Math.cos(GARGANTUA_TILT), sinI = Math.sin(GARGANTUA_TILT);
  const shRx = 1.0 * R, shRy = 0.95 * R;
  ctx.font = `${Math.max(9, R * 0.08)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 이벤트 호라이즌 그림자 — 글리프 밭 한가운데의 깨끗한 검은 구멍
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000000";
  ctx.beginPath(); ctx.ellipse(cx, cy, shRx, shRy, 0, 0, TAU); ctx.fill();

  ctx.globalCompositeOperation = "lighter";
  const buckets: number[][] = WARM.map(() => []);
  const put = (temp: number, sx: number, sy: number, b: number) =>
    buckets[Math.max(0, Math.min(WARM.length - 1, Math.floor(temp * WARM.length)))].push(sx, sy, b);

  // 강착원반 — 기울어진 평면을 도는 글리프. 안쪽이 더 빠르다(케플러).
  for (const p of P.disk) {
    const rr = p.rr;
    const phi = p.phi + GARGANTUA_SPIN * Math.pow(rr, -1.5) * t;
    const c = Math.cos(phi), s = Math.sin(phi);
    const sx = cx + rr * R * c;
    const sy = cy + rr * R * s * cosI;
    const depth = s * sinI;                 // >0 → 뒤편(구 뒤로 가려짐)
    if (depth > 0) {
      const nx = (sx - cx) / shRx, ny = (sy - cy) / shRy;
      if (nx * nx + ny * ny < 1) continue;
    }
    const dopp = 1 + 0.6 * (-c);            // 다가오는 쪽(cosφ<0, 왼쪽)이 더 밝다
    const fall = Math.max(0, 1 - (rr - 1.1) / (3.4 - 1.1));
    let b = (0.32 + 0.68 * fall) * dopp * (0.85 + 0.3 * p.j);
    if (b < 0.12) continue;
    b = Math.min(1, b);
    put(Math.min(1, 0.32 + fall * 0.72 + 0.18 * (-c)), sx, sy, b);
  }

  // 렌즈 헤일로 — 그림자 위/아래로 감긴 빛의 고리
  const rot = t * 0.14;
  for (const p of P.halo) {
    const ang = p.ang + rot, rr = p.rr;
    const sx = cx + rr * R * Math.cos(ang);
    const sy = cy + rr * R * Math.sin(ang) * 0.95;
    const top = 1 + 0.28 * (-Math.sin(ang));
    const tw = 0.72 + 0.28 * Math.sin(t * 1.6 + p.tw);
    const inner = 1 - (rr - 1.05) / (1.34 - 1.05);
    let b = (0.4 + 0.6 * inner) * top * tw;
    if (b < 0.16) continue;
    put(Math.min(1, 0.58 + inner * 0.5), sx, sy, Math.min(1, b));
  }

  // 광자 링 — 그림자를 감싸는 얇고 밝은 테 + 도는 밝은 점
  const hot = (t * 0.5) % TAU;
  for (const p of P.ring) {
    const sx = cx + p.rr * R * Math.cos(p.ang);
    const sy = cy + p.rr * R * Math.sin(p.ang) * 0.95;
    const d = Math.abs(((p.ang - hot + Math.PI) % TAU) - Math.PI);
    const spot = 1 + 0.5 * Math.max(0, 1 - d / 0.6);
    const b = Math.min(1, (0.82 + 0.18 * Math.sin(t * 3 + p.tw)) * spot);
    buckets[WARM.length - 1].push(sx, sy, b);
  }

  // 색 버킷별로 묶어 그린다 (fillStyle 전환 최소화)
  for (let k = 0; k < WARM.length; k++) {
    const arr = buckets[k];
    if (!arr.length) continue;
    ctx.fillStyle = WARM[k];
    for (let i = 0; i < arr.length; i += 3) {
      const b = arr[i + 2];
      ctx.globalAlpha = 0.45 + 0.55 * b;
      ctx.fillText(rampChar(b), arr[i], arr[i + 1]);
    }
  }
  ctx.globalAlpha = 1;
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

    // 블랙홀(Gargantua) 배경의 아스키 별. 리사이즈 때만 다시 뿌린다.
    let stars: Star[] = [];
    const seedStars = () => {
      const n = Math.round((viewW * viewH) / 12000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        a: Math.random() * 0.4 + 0.08,
        ph: Math.random() * Math.PI * 2,
      }));
    };
    // 강착원반/헤일로/광자 링 입자는 R 단위라 한 번만 생성한다 (리사이즈 무관).
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
      haze.addColorStop(0, "rgba(50,26,12,0.25)");
      haze.addColorStop(1, "rgba(50,26,12,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, viewW, viewH);

      // 아스키 별
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#aab4c8";
      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t + s.ph));
        ctx.fillText(".", s.x, s.y);
      }
      ctx.globalAlpha = 1;

      drawGargantua(ctx, cx, cy, R, t, gargantua);

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
