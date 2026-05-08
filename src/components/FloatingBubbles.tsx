"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
];

const BUBBLE_CHARS = ["0", "1", "0", "1", "0", "1", " ", " ", ".", ":", "|", "-", "+", "/", "\\"];
const BG_CHARS     = ["0", "1", "0", "1", " ", " ", " ", ".", " ", "0", "1", " ", "/", ":"];

const CELL          = 12;
const BACKGROUND_FLICKER_RATIO = 1;
const BACKGROUND_FLICKER_INTERVAL_MS = 70;
const BACKGROUND_ALPHA_MULT = 0.8;
const BACKGROUND_ALPHA_MAX  = 0.4;

const CENTER_SHAPE_MIN   = 360;
const CENTER_SHAPE_MAX   = 680;
const CENTER_SHAPE_RATIO = 0.62;

const RIPPLE_BAND_THICK = 180;
const RIPPLE_BAND_THIN  = 25;
const RIPPLE_SPEED      = 600;

interface Cell {
  ch: string;
  color: string;
  alpha: number;
}

interface ShapeDef {
  vertices: [number, number, number][];
  edges: [number, number][];
}

interface Ripple {
  x: number;
  y: number;
  birth: number;
  speed: number;
  band: number;
  life: number;
  color: string;
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_RAW: [number, number, number][] = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
];
const ICO_VERTS: [number, number, number][] = ICO_RAW.map((v) => {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
});
const ICO_EDGE_LEN = (() => {
  const dx = ICO_VERTS[0][0] - ICO_VERTS[1][0];
  const dy = ICO_VERTS[0][1] - ICO_VERTS[1][1];
  const dz = ICO_VERTS[0][2] - ICO_VERTS[1][2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
})();
const ICO_EDGES: [number, number][] = [];
for (let i = 0; i < ICO_VERTS.length; i++) {
  for (let j = i + 1; j < ICO_VERTS.length; j++) {
    const dx = ICO_VERTS[i][0] - ICO_VERTS[j][0];
    const dy = ICO_VERTS[i][1] - ICO_VERTS[j][1];
    const dz = ICO_VERTS[i][2] - ICO_VERTS[j][2];
    if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - ICO_EDGE_LEN) < 0.01) ICO_EDGES.push([i, j]);
  }
}
const ICOSAHEDRON: ShapeDef = { vertices: ICO_VERTS, edges: ICO_EDGES };

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hexDistance(a: string, b: string): number {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

function contrastShapeColor(bgColor: string): string {
  return COLORS.reduce((best, color) => hexDistance(color, bgColor) > hexDistance(best, bgColor) ? color : best, COLORS[0]);
}

function rotate3D(
  x: number, y: number, z: number,
  rx: number, ry: number, rz: number,
): [number, number, number] {
  let ny = y * Math.cos(rx) - z * Math.sin(rx);
  let nz = y * Math.sin(rx) + z * Math.cos(rx);
  y = ny; z = nz;

  let nx = x * Math.cos(ry) + z * Math.sin(ry);
  nz = -x * Math.sin(ry) + z * Math.cos(ry);
  x = nx; z = nz;

  nx = x * Math.cos(rz) - y * Math.sin(rz);
  ny = x * Math.sin(rz) + y * Math.cos(rz);
  return [nx, ny, z];
}

function distToSegSq(
  px: number, py: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return (px - x1) ** 2 + (py - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return (px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2;
}

function projectShape(
  def: ShapeDef,
  time: number,
  cx: number,
  cy: number,
  radius: number,
  rotation: { x: number; y: number; z: number; offset: number },
): { edges: [number, number, number, number][]; boundR: number } {
  const pts: [number, number][] = [];
  const rx = time * rotation.x + rotation.offset;
  const ry = time * rotation.y + rotation.offset * 0.7;
  const rz = time * rotation.z + rotation.offset * 1.3;

  for (const [x0, y0, z0] of def.vertices) {
    const [x, y] = rotate3D(x0, y0, z0, rx, ry, rz);
    pts.push([cx + x * radius, cy + y * radius]);
  }

  let maxR = 0;
  for (const [x, y] of pts) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d > maxR) maxR = d;
  }

  return {
    edges: def.edges.map(([i, j]) => [pts[i][0], pts[i][1], pts[j][0], pts[j][1]]),
    boundR: Math.sqrt(maxR),
  };
}

function BackgroundMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let bgVisualColor = "#06b6d4";
    let centerShapeColor = contrastShapeColor(bgVisualColor);
    let cols = 0;
    let rows = 0;
    let cells: Cell[][] = [];
    let centerShapeRadius = 0;

    const rotation = {
      x: (Math.random() < 0.5 ? -1 : 1) * (1.15 + Math.random() * 0.5),
      y: (Math.random() < 0.5 ? -1 : 1) * (1.35 + Math.random() * 0.55),
      z: (Math.random() < 0.5 ? -1 : 1) * (0.95 + Math.random() * 0.45),
      offset: Math.random() * Math.PI * 2,
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / CELL);
      rows = Math.ceil(canvas.height / CELL);
      centerShapeRadius = Math.min(CENTER_SHAPE_MAX, Math.max(CENTER_SHAPE_MIN, canvas.width * CENTER_SHAPE_RATIO)) / 2;
      cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          ch: Math.random() < 0.18 ? randItem(BG_CHARS) : " ",
          color: bgVisualColor,
          alpha: Math.random() * 0.25 + 0.05,
        }))
      );
    };

    const onBgmVisualTrack = (e: Event) => {
      const { color, transition } = (e as CustomEvent).detail;
      if (typeof color !== "string") return;
      bgVisualColor = color;
      centerShapeColor = contrastShapeColor(color);
      if (transition) return;
      for (let row = 0; row < cells.length; row++) {
        for (let col = 0; col < cells[row].length; col++) cells[row][col].color = color;
      }
    };

    let lastFlickerAt = 0;
    const updateBackgroundNoise = (now: number) => {
      if (now - lastFlickerAt < BACKGROUND_FLICKER_INTERVAL_MS) return;
      lastFlickerAt = now;

      const count = Math.max(1, Math.floor(cols * rows * BACKGROUND_FLICKER_RATIO));
      for (let i = 0; i < count; i++) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const cell = cells[row]?.[col];
        if (!cell) continue;

        if (Math.random() < 0.22) {
          cell.ch = " ";
        } else {
          cell.ch = randItem(BG_CHARS);
          cell.color = bgVisualColor;
          cell.alpha = Math.random() * 0.22 + 0.06;
        }
      }
    };

    const ripples: Ripple[] = [];
    const onRipple = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const band = detail.band ?? (detail.thin ? RIPPLE_BAND_THIN : RIPPLE_BAND_THICK);
      const dx = Math.max(detail.x, canvas.width - detail.x);
      const dy = Math.max(detail.y, canvas.height - detail.y);
      const maxDist = Math.sqrt(dx * dx + dy * dy) + band;
      ripples.push({
        x: detail.x,
        y: detail.y,
        birth: performance.now() / 1000,
        speed: RIPPLE_SPEED,
        band,
        life: maxDist / RIPPLE_SPEED + 0.1,
        color: typeof detail.color === "string" ? detail.color : bgVisualColor,
      });
    };

    const bubblePick = Array.from({ length: 256 }, () => randItem(BUBBLE_CHARS));
    let pickIdx = 0;
    const nextBubbleCh = () => bubblePick[(pickIdx++) & 255];

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${CELL}px monospace`;
      ctx.textBaseline = "top";

      for (let i = ripples.length - 1; i >= 0; i--) {
        if (time - ripples[i].birth > ripples[i].life) ripples.splice(i, 1);
      }

      const rippleFrames = ripples.map((ripple) => {
        const front = (time - ripple.birth) * ripple.speed;
        const inner = front - ripple.band;
        const outer = front + ripple.band;
        return {
          x: ripple.x,
          y: ripple.y,
          innerSq: inner > 0 ? inner * inner : 0,
          outerSq: outer * outer,
          hasInner: inner > 0,
          color: ripple.color,
        };
      });
      const hasRipples = rippleFrames.length > 0;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const edgeW = Math.max(CELL * 0.5, centerShapeRadius * 0.035);
      const projectedShape = projectShape(ICOSAHEDRON, time, cx, cy, centerShapeRadius, rotation);
      const shapeOuterSq = (projectedShape.boundR + CELL * 2) ** 2;
      const edgeWSq = edgeW * edgeW;

      for (let row = 0; row < rows; row++) {
        const py = row * CELL + CELL / 2;
        for (let col = 0; col < cols; col++) {
          const px = col * CELL + CELL / 2;
          const cell = cells[row][col];

          if (hasRipples) {
            let rippleColor: string | null = null;
            for (let i = 0; i < rippleFrames.length; i++) {
              const ripple = rippleFrames[i];
              const dx = px - ripple.x, dy = py - ripple.y;
              const distSq = dx * dx + dy * dy;
              if (distSq <= ripple.outerSq && (!ripple.hasInner || distSq >= ripple.innerSq)) {
                rippleColor = ripple.color;
                break;
              }
            }
            if (rippleColor) {
              cell.color = rippleColor;
              ctx.globalAlpha = 1;
              ctx.fillStyle = rippleColor;
              ctx.fillText(nextBubbleCh(), col * CELL, row * CELL);
              continue;
            }
          }

          if (cell.ch === " ") continue;

          let isShapeCell = false;
          const dx = px - cx, dy = py - cy;
          if (dx * dx + dy * dy <= shapeOuterSq) {
            const edges = projectedShape.edges;
            for (let i = 0; i < edges.length; i++) {
              const edge = edges[i];
              if (distToSegSq(px, py, edge[0], edge[1], edge[2], edge[3]) < edgeWSq) {
                isShapeCell = true;
                break;
              }
            }
          }

          if (isShapeCell) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = centerShapeColor;
            ctx.fillText(nextBubbleCh(), col * CELL, row * CELL);
          } else {
            ctx.globalAlpha = Math.min(BACKGROUND_ALPHA_MAX, cell.alpha * BACKGROUND_ALPHA_MULT);
            ctx.fillStyle = cell.color;
            ctx.fillText(cell.ch, col * CELL, row * CELL);
          }
        }
      }

      ctx.globalAlpha = 1;
    };

    let rafId: number;
    const loop = () => {
      const now = performance.now();
      updateBackgroundNoise(now);
      draw(now / 1000);
      rafId = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("bgm-visual-track", onBgmVisualTrack);
    window.addEventListener("ascii-ripple", onRipple);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("bgm-visual-track", onBgmVisualTrack);
      window.removeEventListener("ascii-ripple", onRipple);
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

export default function FloatingBubbles() {
  return <BackgroundMatrix />;
}
