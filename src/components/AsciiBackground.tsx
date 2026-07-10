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

    // 블랙홀 이벤트 호라이즌 그라디언트: 레이아웃/도형이 바뀔 때만 다시 만든다 (매 프레임 재생성 방지).
    let coreGrad: CanvasGradient | null = null;
    const updateCoreGradient = () => {
      const fill = activeShape.coreFill;
      if (!fill) { coreGrad = null; return; }
      const cx = viewW / 2, cy = viewH / 2;
      const r = centerShapeRadius * (activeShape.scale ?? 1) * fill;
      if (r <= 0) { coreGrad = null; return; }
      const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,0.82)");
      g.addColorStop(0.7, "rgba(0,0,0,0.6)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      coreGrad = g;
    };

    const setShape = (id: ShapeId | "random") => {
      const next = id === "random" ? randomShapeId(activeShapeId) : id;
      if (next === activeShapeId) return;
      activeShapeId = next;
      activeShape = SHAPE_REGISTRY[next];
      rotation = randomRotation();
      updateCoreGradient();
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
      updateCoreGradient();
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

      // 블랙홀 이벤트 호라이즌: 미리 만들어둔 그라디언트로 중심을 어둡게 눌러 빛을 삼킨 코어를 만든다.
      // 원반 링/나선을 그리기 전에 깔아, 밝은 선이 어두운 구(球) 위를 지나가게 한다.
      if (activeShape.coreFill && coreGrad) {
        const r = radius * activeShape.coreFill;
        ctx.globalAlpha = 1;
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(viewW / 2, viewH / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }

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
      fillBackground(now);
      strokeShape(time);
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
