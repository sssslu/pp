"use client";

import { useEffect, useRef } from "react";

// ── 상수 ──────────────────────────────────────────────────────────────

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
];

// 버블 영역 내 ASCII 문자 (숫자/기호 위주)
const BUBBLE_CHARS = ["0", "1", "0", "1", "0", "1", " ", " ", ".", ":", "|", "-", "+", "/", "\\"];
// 배경 ASCII 문자 (0·1·공백 위주로 더 희박하게)
const BG_CHARS     = ["0", "1", "0", "1", " ", " ", " ", ".", " ", "0", "1", " ", "/", ":"];

const CELL          = 12;   // 셀 크기(px)
const FLICKER_RATIO = 0.08; // 한 프레임에 갱신할 셀 비율

const REPULSION_RADIUS  = 500;
const MAX_REPULSION     = 650;
const LERP              = 0.05;

const MOBILE_BREAKPOINT = 768; // 이 너비 이하를 모바일로 간주
const MOBILE_SIZE_MULT  = 0.25; // 버블 크기 배율
const MOBILE_SPEED_MULT = 2.5;  // 이동 속도 배율
const MOBILE_AMP_MULT   = 0.5;  // 진폭 배율

// ── 타입 ──────────────────────────────────────────────────────────────

interface Cell {
  ch:    string;
  color: string;
  alpha: number;
}

interface Bubble {
  size:      number;
  initialX:  number;
  initialY:  number;
  color:     string;
  speed:     number;
  amplitude: number;
  offset:    number;
  avoidX:    number;
  avoidY:    number;
}

// ── 유틸 ──────────────────────────────────────────────────────────────

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency <= 4) || (nav.deviceMemory ?? Infinity) <= 4;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────

function BackgroundMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lowEnd       = isLowEndDevice();
    const flickerRatio = lowEnd ? FLICKER_RATIO / 2 : FLICKER_RATIO;

    let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return; // 모바일에서는 커서 반발 없음
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isMobile) return; // 모바일에서는 터치 반발 없음
      if (e.touches.length > 0)
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });

    // ── 셀 그리드 ─────────────────────────────────────────────────────

    let cols  = 0;
    let rows  = 0;
    let cells: Cell[][] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      isMobile = canvas.width <= MOBILE_BREAKPOINT;
      if (isMobile) mousePos.current = { x: -9999, y: -9999 }; // 모바일 전환 시 반발 초기화
      cols = Math.ceil(canvas.width  / CELL);
      rows = Math.ceil(canvas.height / CELL);
      cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          ch:    Math.random() < 0.18 ? randItem(BG_CHARS) : " ",
          color: randItem(COLORS),
          alpha: Math.random() * 0.25 + 0.05,
        }))
      );
    };

    // ── 버블 초기화 ───────────────────────────────────────────────────

    const bubbleCount = isMobile
      ? (lowEnd ? 14 : 26)  // 모바일: 2배
      : (lowEnd ?  7 : 13); // 데스크톱: 기본
    const bubbles: Bubble[] = Array.from({ length: bubbleCount }, (_, i) => {
      const size = i === 0 ? 450
                 : i <  3 ? Math.random() * 150 + 300
                           : Math.random() * 120 + 50;
      return {
        size,
        initialX:  Math.random() * 80 + 10,
        initialY:  Math.random() * 80 + 10,
        color:     randItem(COLORS),
        speed:     Math.random() * 1.2 + 0.3,
        amplitude: Math.random() * 200 + 60,
        offset:    Math.random() * Math.PI * 2,
        avoidX:    0,
        avoidY:    0,
      };
    });

    // ── 버블 위치 계산 (마우스 반발 포함) ────────────────────────────

    // 현재 모바일 여부에 따른 실제 반지름 반환
    const effRadius = (b: Bubble) => (b.size * (isMobile ? MOBILE_SIZE_MULT : 1)) / 2;

    const updateBubble = (b: Bubble, t: number): { cx: number; cy: number } => {
      const winW      = window.innerWidth;
      const winH      = window.innerHeight;
      const baseX     = (b.initialX / 100) * winW;
      const baseY     = (b.initialY / 100) * winH;
      const speedMult = isMobile ? MOBILE_SPEED_MULT : 1;
      const ampMult   = isMobile ? MOBILE_AMP_MULT   : 1;
      const halfSize  = effRadius(b);
      const ambX  = Math.sin(t * b.speed * speedMult + b.offset)        * b.amplitude * ampMult
                  + Math.sin(t * b.speed * speedMult * 0.37 + b.offset) * (b.amplitude * ampMult * 0.5);
      const ambY  = Math.cos(t * b.speed * speedMult * 0.8  + b.offset) * b.amplitude * ampMult
                  + Math.cos(t * b.speed * speedMult * 0.31  + b.offset) * (b.amplitude * ampMult * 0.5);

      const cx0 = baseX + ambX + b.avoidX + halfSize;
      const cy0 = baseY + ambY + b.avoidY + halfSize;
      const mdx = cx0 - mousePos.current.x;
      const mdy = cy0 - mousePos.current.y;
      const dist = Math.sqrt(mdx * mdx + mdy * mdy);

      let targetAvoidX = 0;
      let targetAvoidY = 0;
      if (dist < REPULSION_RADIUS && dist > 0) {
        const force  = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
        const angle  = Math.atan2(mdy, mdx);
        targetAvoidX = Math.cos(angle) * force * MAX_REPULSION;
        targetAvoidY = Math.sin(angle) * force * MAX_REPULSION;
      }
      b.avoidX += (targetAvoidX - b.avoidX) * LERP;
      b.avoidY += (targetAvoidY - b.avoidY) * LERP;

      return {
        cx: baseX + ambX + b.avoidX + halfSize,
        cy: baseY + ambY + b.avoidY + halfSize,
      };
    };

    // ── 셀 플리커 ─────────────────────────────────────────────────────

    const flicker = () => {
      const count = Math.floor(cols * rows * flickerRatio);
      for (let i = 0; i < count; i++) {
        const r    = Math.floor(Math.random() * rows);
        const c    = Math.floor(Math.random() * cols);
        const roll = Math.random();
        if (roll < 0.3) {
          cells[r][c].ch = " ";
        } else if (roll < 0.6) {
          cells[r][c].ch    = randItem(BG_CHARS);
          cells[r][c].alpha = Math.random() * 0.25 + 0.05;
        } else {
          cells[r][c].ch    = randItem(BG_CHARS);
          cells[r][c].color = randItem(COLORS);
          cells[r][c].alpha = Math.random() * 0.25 + 0.05;
        }
      }
    };

    // ── 렌더링 ────────────────────────────────────────────────────────

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font         = `${CELL}px monospace`;
      ctx.textBaseline = "top";

      const centers = bubbles.map((b) => ({ ...updateBubble(b, t), r: effRadius(b), color: b.color }));

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = cells[row][col];
          if (cell.ch === " ") continue;

          const px = col * CELL + CELL / 2;
          const py = row * CELL + CELL / 2;

          let bubbleColor: string | null = null;
          for (const { cx, cy, r, color } of centers) {
            const dx = px - cx, dy = py - cy;
            if (dx * dx + dy * dy < r * r) { bubbleColor = color; break; }
          }

          if (bubbleColor) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle   = bubbleColor;
            ctx.fillText(randItem(BUBBLE_CHARS), col * CELL, row * CELL);
          } else {
            ctx.globalAlpha = cell.alpha;
            ctx.fillStyle   = cell.color;
            ctx.fillText(cell.ch, col * CELL, row * CELL);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    // ── 루프 시작 ─────────────────────────────────────────────────────

    let rafId: number;
    const loop = () => {
      flicker();
      draw(performance.now() / 1000);
      rafId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        0,
      }}
    />
  );
}

export default function FloatingBubbles() {
  return <BackgroundMatrix />;
}
