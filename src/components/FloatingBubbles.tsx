"use client";

import { useEffect, useRef } from "react";

// ── 상수 ──────────────────────────────────────────────
const COLORS = [
  "#ef4444","#f97316","#eab308","#84cc16","#10b981",
  "#06b6d4","#3b82f6","#8b5cf6","#d946ef","#ec4899",
];

const ASCII_CHARS = ['0','1','0','1','0','1',' ',' ','.',':', '|','-','+','/','\\'];
const BG_CHARS    = ['0','1','0','1',' ',' ',' ','.',' ','0','1',' ','/',':'];
const CELL = 12;
const FLICKER_RATIO = 0.08;

// ── 타입 ──────────────────────────────────────────────
interface Bubble {
  size: number;
  initialX: number;
  initialY: number;
  color: string;
  speed: number;
  amplitude: number;
  offset: number;
  avoidX: number;
  avoidY: number;
}

// ── 유틸 ──────────────────────────────────────────────
function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  return false;
}

// ── 컴포넌트 ──────────────────────────────────────────
function BackgroundMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lowEnd = isLowEndDevice();
    const flickerRatio = lowEnd ? FLICKER_RATIO / 2 : FLICKER_RATIO;

    const onMouseMove = (e: MouseEvent)  => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    const onTouchMove = (e: TouchEvent)  => {
      if (e.touches.length > 0)
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });

    let cols = 0, rows = 0;
    let cells: { ch: string; color: string; alpha: number }[][] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width  / CELL);
      rows = Math.ceil(canvas.height / CELL);
      cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          ch:    Math.random() < 0.18 ? BG_CHARS[Math.floor(Math.random() * BG_CHARS.length)] : " ",
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: Math.random() * 0.25 + 0.05,
        }))
      );
    };

    const bubbleCount = lowEnd ? 7 : 13;
    const bubbles: Bubble[] = Array.from({ length: bubbleCount }, (_, i) => {
      const size = i === 0 ? 450
                 : i < 3  ? Math.random() * 150 + 300
                           : Math.random() * 120 + 50;
      return {
        size,
        initialX:  Math.random() * 80 + 10,
        initialY:  Math.random() * 80 + 10,
        color:     COLORS[Math.floor(Math.random() * COLORS.length)],
        speed:     Math.random() * 1.2 + 0.3,
        amplitude: Math.random() * 200 + 60,
        offset:    Math.random() * Math.PI * 2,
        avoidX: 0,
        avoidY: 0,
      };
    });

    const REPULSION_RADIUS = 500;
    const MAX_REPULSION    = 650;
    const LERP             = 0.05;

    const updateBubble = (b: Bubble, t: number): { cx: number; cy: number } => {
      const winW  = window.innerWidth;
      const winH  = window.innerHeight;
      const baseX = (b.initialX / 100) * winW;
      const baseY = (b.initialY / 100) * winH;
      const ambX  = Math.sin(t * b.speed + b.offset) * b.amplitude
                  + Math.sin(t * b.speed * 0.37 + b.offset) * (b.amplitude * 0.5);
      const ambY  = Math.cos(t * b.speed * 0.8  + b.offset) * b.amplitude
                  + Math.cos(t * b.speed * 0.31  + b.offset) * (b.amplitude * 0.5);

      const cx0  = baseX + ambX + b.avoidX + b.size / 2;
      const cy0  = baseY + ambY + b.avoidY + b.size / 2;
      const mx   = mousePos.current.x;
      const my   = mousePos.current.y;
      const mdx  = cx0 - mx;
      const mdy  = cy0 - my;
      const dist = Math.sqrt(mdx * mdx + mdy * mdy);
      let targetAvoidX = 0, targetAvoidY = 0;
      if (dist < REPULSION_RADIUS && dist > 0) {
        const force  = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
        const angle  = Math.atan2(mdy, mdx);
        targetAvoidX = Math.cos(angle) * force * MAX_REPULSION;
        targetAvoidY = Math.sin(angle) * force * MAX_REPULSION;
      }
      b.avoidX += (targetAvoidX - b.avoidX) * LERP;
      b.avoidY += (targetAvoidY - b.avoidY) * LERP;

      return {
        cx: baseX + ambX + b.avoidX + b.size / 2,
        cy: baseY + ambY + b.avoidY + b.size / 2,
      };
    };

    const flicker = () => {
      const total = cols * rows;
      const count = Math.floor(total * flickerRatio);
      for (let i = 0; i < count; i++) {
        const r    = Math.floor(Math.random() * rows);
        const c    = Math.floor(Math.random() * cols);
        const roll = Math.random();
        if (roll < 0.3) {
          cells[r][c].ch = " ";
        } else if (roll < 0.6) {
          cells[r][c].ch    = BG_CHARS[Math.floor(Math.random() * BG_CHARS.length)];
          cells[r][c].alpha = Math.random() * 0.25 + 0.05;
        } else {
          cells[r][c].ch    = BG_CHARS[Math.floor(Math.random() * BG_CHARS.length)];
          cells[r][c].color = COLORS[Math.floor(Math.random() * COLORS.length)];
          cells[r][c].alpha = Math.random() * 0.25 + 0.05;
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font         = `${CELL}px monospace`;
      ctx.textBaseline = "top";

      const centers = bubbles.map((b) => ({ ...updateBubble(b, t), r: b.size / 2, color: b.color }));

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
            ctx.fillText(ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)], col * CELL, row * CELL);
          } else {
            ctx.globalAlpha = cell.alpha;
            ctx.fillStyle   = cell.color;
            ctx.fillText(cell.ch, col * CELL, row * CELL);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

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
