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
const NARROW_MOBILE_BREAKPOINT = 430;
const CENTER_SHAPE_MIN  = 180;
const CENTER_SHAPE_MAX  = 680;
const CENTER_SHAPE_RATIO = 0.42;

// ── 기하학적 도형 정의 ───────────────────────────────────────────────

interface ShapeDef {
  vertices: number[][];
  edges: [number, number][];
  dim: 3 | 4;
}

// 정육면체 (꼭짓점 단위 구에 정규화)
const C = 1 / Math.sqrt(3);
const CUBE: ShapeDef = {
  dim: 3,
  vertices: [
    [-C,-C,-C],[C,-C,-C],[C,C,-C],[-C,C,-C],
    [-C,-C, C],[C,-C, C],[C,C, C],[-C,C, C],
  ],
  edges: [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ],
};

// 정팔면체
const OCTAHEDRON: ShapeDef = {
  dim: 3,
  vertices: [
    [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
  ],
  edges: [
    [0,2],[0,3],[0,4],[0,5],
    [1,2],[1,3],[1,4],[1,5],
    [2,4],[2,5],[3,4],[3,5],
  ],
};

// 정이십면체
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_RAW: number[][] = [
  [0,1,PHI],[0,-1,PHI],[0,1,-PHI],[0,-1,-PHI],
  [1,PHI,0],[-1,PHI,0],[1,-PHI,0],[-1,-PHI,0],
  [PHI,0,1],[-PHI,0,1],[PHI,0,-1],[-PHI,0,-1],
];
const ICO_VERTS = ICO_RAW.map(v => {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
});
const ICO_EDGE_LEN = (() => {
  const d = [
    ICO_VERTS[0][0] - ICO_VERTS[1][0],
    ICO_VERTS[0][1] - ICO_VERTS[1][1],
    ICO_VERTS[0][2] - ICO_VERTS[1][2],
  ];
  return Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
})();
const ICO_EDGES: [number, number][] = [];
for (let i = 0; i < 12; i++) {
  for (let j = i + 1; j < 12; j++) {
    const dx = ICO_VERTS[i][0] - ICO_VERTS[j][0];
    const dy = ICO_VERTS[i][1] - ICO_VERTS[j][1];
    const dz = ICO_VERTS[i][2] - ICO_VERTS[j][2];
    if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - ICO_EDGE_LEN) < 0.01) {
      ICO_EDGES.push([i, j]);
    }
  }
}
const ICOSAHEDRON: ShapeDef = { dim: 3, vertices: ICO_VERTS, edges: ICO_EDGES };

// 테서랙트 (4D 하이퍼큐브)
const TESSERACT: ShapeDef = {
  dim: 4,
  vertices: Array.from({ length: 16 }, (_, i) => [
    (i & 1) ? 0.5 : -0.5,
    (i & 2) ? 0.5 : -0.5,
    (i & 4) ? 0.5 : -0.5,
    (i & 8) ? 0.5 : -0.5,
  ]),
  edges: (() => {
    const e: [number, number][] = [];
    for (let i = 0; i < 16; i++)
      for (let j = i + 1; j < 16; j++)
        if ((i ^ j) && !((i ^ j) & ((i ^ j) - 1))) e.push([i, j]);
    return e;
  })(),
};

const SHAPE_CUBE = 0;
const SHAPE_ICOSAHEDRON = 1;
const SHAPE_TESSERACT = 2;
const SHAPES: ShapeDef[] = [CUBE, ICOSAHEDRON, TESSERACT];

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
  shape:     number;
  rotSpdX:   number;
  rotSpdY:   number;
  rotSpdZ:   number;
  rotSpdW:   number;
}

type BgmVisualWindow = Window & { __bgmBeatPulse?: number };

// ── 유틸 ──────────────────────────────────────────────────────────────

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency <= 4) || (nav.deviceMemory ?? Infinity) <= 4;
}

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

function getCenterShapeIndex(width: number): number {
  if (width <= NARROW_MOBILE_BREAKPOINT) return SHAPE_CUBE;
  if (width <= MOBILE_BREAKPOINT) return SHAPE_TESSERACT;
  return SHAPE_ICOSAHEDRON;
}

// 3D 오일러 회전 (XYZ)
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

// 4D 회전 (XW 평면 + YZ 평면)
function rotate4D(
  x: number, y: number, z: number, w: number,
  aXW: number, aYZ: number,
): [number, number, number, number] {
  let nx = x * Math.cos(aXW) - w * Math.sin(aXW);
  let nw = x * Math.sin(aXW) + w * Math.cos(aXW);
  x = nx; w = nw;
  const ny = y * Math.cos(aYZ) - z * Math.sin(aYZ);
  const nz = y * Math.sin(aYZ) + z * Math.cos(aYZ);
  return [x, ny, nz, w];
}

// 4D → 3D 투시 투영
function project4Dto3D(
  x: number, y: number, z: number, w: number,
): [number, number, number] {
  const d = 2.5;
  const s = d / (d - w);
  return [x * s, y * s, z * s];
}

// 점 → 선분 거리² (2D)
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

// 도형 정점을 회전·투영하여 2D 엣지 배열 반환
function projectShape(
  def: ShapeDef, t: number, b: Bubble,
  cx: number, cy: number, radius: number,
): { edges: [number, number, number, number][]; boundR: number } {
  const rx = t * b.rotSpdX, ry = t * b.rotSpdY, rz = t * b.rotSpdZ;
  const rw = t * b.rotSpdW;
  const pts: [number, number][] = [];

  for (const v of def.vertices) {
    let x: number, y: number, z: number;
    if (def.dim === 4) {
      const [a, b4, c, d] = rotate4D(v[0], v[1], v[2], v[3], rw, rw * 0.71);
      [x, y, z] = project4Dto3D(a, b4, c, d);
    } else {
      x = v[0]; y = v[1]; z = v[2];
    }
    const [px, py] = rotate3D(x, y, z, rx, ry, rz);
    pts.push([cx + px * radius, cy + py * radius]);
  }

  const edges: [number, number, number, number][] = def.edges.map(([i, j]) => [
    pts[i][0], pts[i][1], pts[j][0], pts[j][1],
  ]);

  let maxR = 0;
  for (const [px, py] of pts) {
    const d = (px - cx) ** 2 + (py - cy) ** 2;
    if (d > maxR) maxR = d;
  }

  return { edges, boundR: Math.sqrt(maxR) };
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
    let bgVisualColor = "#06b6d4";
    let centerShapeColor = contrastShapeColor(bgVisualColor);

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
    window.addEventListener("bgm-visual-track", onBgmVisualTrack);

    // ── 셀 그리드 ─────────────────────────────────────────────────────

    let cols  = 0;
    let rows  = 0;
    let cells: Cell[][] = [];
    let centerShapeRadius = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      isMobile = canvas.width <= MOBILE_BREAKPOINT;
      if (isMobile) mousePos.current = { x: -9999, y: -9999 }; // 모바일 전환 시 반발 초기화
      cols = Math.ceil(canvas.width  / CELL);
      rows = Math.ceil(canvas.height / CELL);
      centerShapeRadius = Math.min(CENTER_SHAPE_MAX, Math.max(CENTER_SHAPE_MIN, canvas.width * CENTER_SHAPE_RATIO)) / 2;
      cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          ch:    Math.random() < 0.18 ? randItem(BG_CHARS) : " ",
          color: bgVisualColor,
          alpha: Math.random() * 0.25 + 0.05,
        }))
      );
    };

    // ── 중앙 도형 초기화 ─────────────────────────────────────────────

    const centerShape: Bubble = {
      size:      0,
      initialX:  50,
      initialY:  50,
      color:     centerShapeColor,
      speed:     1,
      amplitude: 0,
      offset:    Math.random() * Math.PI * 2,
      avoidX:    0,
      avoidY:    0,
      shape:     SHAPE_ICOSAHEDRON,
      rotSpdX:   (Math.random() < 0.5 ? -1 : 1) * (1.15 + Math.random() * 0.5),
      rotSpdY:   (Math.random() < 0.5 ? -1 : 1) * (1.35 + Math.random() * 0.55),
      rotSpdZ:   (Math.random() < 0.5 ? -1 : 1) * (0.95 + Math.random() * 0.45),
      rotSpdW:   (Math.random() < 0.5 ? -1 : 1) * (1.0 + Math.random() * 0.5),
    };

    // ── 버블 위치 계산 (마우스 반발 포함) ────────────────────────────

    const effRadius = (b: Bubble) => b.size / 2;

    const updateBubble = (b: Bubble, t: number): { cx: number; cy: number } => {
      const winW      = window.innerWidth;
      const winH      = window.innerHeight;
      const baseX     = (b.initialX / 100) * winW;
      const baseY     = (b.initialY / 100) * winH;
      const halfSize  = effRadius(b);
      const ambX  = Math.sin(t * b.speed + b.offset)        * b.amplitude
                  + Math.sin(t * b.speed * 0.37 + b.offset) * (b.amplitude * 0.5);
      const ambY  = Math.cos(t * b.speed * 0.8  + b.offset) * b.amplitude
                  + Math.cos(t * b.speed * 0.31  + b.offset) * (b.amplitude * 0.5);

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
          cells[r][c].color = bgVisualColor;
          cells[r][c].alpha = Math.random() * 0.25 + 0.05;
        }
      }
    };

    // ── 리플 시스템 ─────────────────────────────────────────────────

    interface Ripple { x: number; y: number; birth: number; speed: number; maxR: number; band: number; life: number; color: string; }
    const ripples: Ripple[] = [];
    const RIPPLE_BAND_THICK = 180;       // 꾹 누름 파동 띠 두께(px)
    const RIPPLE_BAND_THIN  = 25;        // 일반 클릭 파동 띠 두께(px)
    const RIPPLE_SPEED      = 600;       // px/s

    const onRipple = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const band = detail.band ?? (detail.thin ? RIPPLE_BAND_THIN : RIPPLE_BAND_THICK);
      const dx = Math.max(detail.x, canvas.width - detail.x);
      const dy = Math.max(detail.y, canvas.height - detail.y);
      const maxDist = Math.sqrt(dx * dx + dy * dy) + band;
      const lifespan = maxDist / RIPPLE_SPEED + 0.1;
      ripples.push({
        x: detail.x,
        y: detail.y,
        birth: performance.now() / 1000,
        speed: RIPPLE_SPEED,
        maxR: maxDist,
        band,
        life: lifespan,
        color: typeof detail.color === "string" ? detail.color : bgVisualColor,
      });
    };
    window.addEventListener("ascii-ripple", onRipple);

    // ── Pre-pick 문자 배열 (hot loop에서 randItem 대신 순환 인덱스 사용) ──

    const BUBBLE_PICK_LEN = 256;
    const bubblePick: string[] = Array.from({ length: BUBBLE_PICK_LEN }, () => randItem(BUBBLE_CHARS));
    let pickIdx = 0;
    const nextBubbleCh = () => bubblePick[(pickIdx++) & 255];

    // ── 렌더링 ────────────────────────────────────────────────────────

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font         = `${CELL}px monospace`;
      ctx.textBaseline = "top";

      // 만료된 리플 제거
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (t - ripples[i].birth > ripples[i].life) ripples.splice(i, 1);
      }

      // 리플 프레임 데이터 미리 계산 (inner² / outer² for fast reject)
      const rippleFrames = ripples.map(rp => {
        const front = (t - rp.birth) * rp.speed;
        const inner = front - rp.band;
        const outer = front + rp.band;
        return { x: rp.x, y: rp.y, innerSq: inner > 0 ? inner * inner : 0, outerSq: outer * outer, hasInner: inner > 0, color: rp.color };
      });
      const hasRipples = rippleFrames.length > 0;
      const beatPulse = (window as BgmVisualWindow).__bgmBeatPulse ?? 0;
      const beatFlash = Math.pow(beatPulse, 0.55);
      const bgAlphaMult = 0.36 + beatFlash * 2.65;

      // 중앙 도형의 와이어프레임 엣지 계산
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      centerShape.shape = getCenterShapeIndex(canvas.width);
      const edgeW = Math.max(CELL * 0.5, centerShapeRadius * 0.035);
      const projectedShape = projectShape(SHAPES[centerShape.shape], t + centerShape.offset, centerShape, cx, cy, centerShapeRadius);
      const projected = [{
        cx,
        cy,
        boundR: projectedShape.boundR,
        color: centerShapeColor,
        edges: projectedShape.edges,
        edgeWSq: edgeW * edgeW,
        outerSq: (projectedShape.boundR + CELL * 2) ** 2,
      }];

      for (let row = 0; row < rows; row++) {
        const py = row * CELL + CELL / 2;
        for (let col = 0; col < cols; col++) {
          const px = col * CELL + CELL / 2;
          const cell = cells[row][col];

          // 리플 영향 계산 (squared distance로 빠른 판별)
          if (hasRipples) {
            let rippleColor: string | null = null;
            for (let ri = 0; ri < rippleFrames.length; ri++) {
              const rf = rippleFrames[ri];
              const dx = px - rf.x, dy = py - rf.y;
              const distSq = dx * dx + dy * dy;
              if (distSq <= rf.outerSq && (!rf.hasInner || distSq >= rf.innerSq)) {
                rippleColor = rf.color;
                break;
              }
            }
            if (rippleColor) {
              cell.color = rippleColor;
              ctx.globalAlpha = 1;
              ctx.fillStyle   = rippleColor;
              ctx.fillText(nextBubbleCh(), col * CELL, row * CELL);
              continue;
            }
          }

          if (cell.ch === " ") continue;

          let wireColor: string | null = null;
          for (let si = 0; si < projected.length; si++) {
            const s = projected[si];
            const dx = px - s.cx, dy = py - s.cy;
            const distSq = dx * dx + dy * dy;
            if (distSq > s.outerSq) continue;

            const edges = s.edges;
            for (let ei = 0; ei < edges.length; ei++) {
              const e = edges[ei];
              if (distToSegSq(px, py, e[0], e[1], e[2], e[3]) < s.edgeWSq) {
                wireColor = s.color;
                break;
              }
            }
            if (wireColor) break;
          }

          if (wireColor) {
            ctx.globalAlpha = 1;
            ctx.fillStyle   = wireColor;
            ctx.fillText(nextBubbleCh(), col * CELL, row * CELL);
          } else {
            ctx.globalAlpha = Math.min(0.42, cell.alpha * bgAlphaMult);
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
      window.removeEventListener("bgm-visual-track", onBgmVisualTrack);
      window.removeEventListener("ascii-ripple", onRipple);
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
