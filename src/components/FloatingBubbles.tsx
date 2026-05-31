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

// ── 불가능 삼각형 · 철가루 자기장 ─────────────────────────────────────
// 세 개의 막대(=전류가 흐르는 도선)가 삼각형을 이루고, 각 셀의 ASCII 문자가
// 그 지점의 자기장 방향(- \ | /)으로 정렬되어 "철가루 결"을 그린다.
const FIELD_TANGENT_W = 1.0;   // 막대를 따라 흐르는 성분
const FIELD_CURL_W    = 0.55;  // 막대를 휘감는 성분 (철가루 곡선)
const FIELD_FALLOFF_R = 0.14;  // 거리 감쇠 스케일 (centerShapeRadius 대비)
const BAR_SOLID_R     = 0.055; // 막대(빔) 두께 (centerShapeRadius 대비)
const BAR_OVERSHOOT   = 1.7;   // 모서리에서 막대가 다음 막대 위로 겹치는 양 (빔두께 배수)
const FIELD_BOUND_R   = 1.60;  // 자기장 연산 영역 반경 (centerShapeRadius 대비)
const BEAM_ALPHA      = 0.95;  // 빔(막대 본체) 밝기
const HALO_ALPHA_MAX  = 0.5;   // 주변 철가루 최대 밝기
const HALO_GAIN       = 0.8;   // 자기장 세기 → 밝기 환산
const HALO_MIN        = 0.07;  // 이보다 약하면 일반 배경 노이즈로 둠

// 살아 움직이는 impossible figure — 끝없이 회전·호흡·비틀림 (#21 모핑)
const ROT_SPEED    = 0.14;     // 면내 회전 (rad/s)
const TWIST_AMP    = 0.13;     // 모서리 각도 뒤틀림 진폭 (rad)
const TWIST_SPEED  = 0.6;
const BREATH_AMP   = 0.05;     // 반지름 호흡 진폭 (비율)
const BREATH_SPEED = 0.5;

// 자기장 각도 → ASCII 방향 문자. 화면 y가 아래로 향하므로 \ 와 / 위치에 주의.
const ORIENT_CHARS = ["-", "\\", "|", "/"];

interface Cell {
  ch: string;
  color: string;
  alpha: number;
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

interface Bar {
  x1: number; y1: number; x2: number; y2: number; // 막대 척추(spine) 양 끝
  tx: number; ty: number;                          // 단위 접선
  lenSq: number;
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

/** 자기장 벡터의 방향을 가장 가까운 ASCII 결 문자로 양자화한다. */
function fieldChar(fx: number, fy: number): string {
  let a = Math.atan2(fy, fx);
  if (a < 0) a += Math.PI;            // 선(line) 방향이므로 0..π로 접는다
  const s = Math.round(a / (Math.PI / 4)) % 4;
  return ORIENT_CHARS[s];
}

/**
 * 불가능 삼각형을 이루는 세 막대를 만든다.
 * 회전(rot)에 더해 모서리마다 위상이 다른 비틀림·호흡을 주어 영원히 살아 움직이게 한다.
 * 막대 끝을 BAR_OVERSHOOT 만큼 늘려 다음 막대 위로 겹치게 하면, 순환 occlusion과 맞물려
 * 펜로즈 삼각형의 "불가능한 짜임"이 만들어진다.
 */
function buildTriangleBars(cx: number, cy: number, R: number, rot: number, time: number, overshoot: number): Bar[] {
  const corners: [number, number][] = [];
  for (let k = 0; k < 3; k++) {
    const ang = rot + k * (2 * Math.PI / 3) + TWIST_AMP * Math.sin(time * TWIST_SPEED + k * 2.1);
    const rr  = R * (1 + BREATH_AMP * Math.sin(time * BREATH_SPEED + k * 1.7));
    corners.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
  }
  const bars: Bar[] = [];
  for (let k = 0; k < 3; k++) {
    const [ax, ay] = corners[k];
    const [bx, by] = corners[(k + 1) % 3];
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const tx = dx / len, ty = dy / len;
    const ex = tx * overshoot, ey = ty * overshoot;
    const x1 = ax - ex, y1 = ay - ey, x2 = bx + ex, y2 = by + ey;
    const sdx = x2 - x1, sdy = y2 - y1;
    bars.push({ x1, y1, x2, y2, tx, ty, lenSq: sdx * sdx + sdy * sdy });
  }
  return bars;
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
    let rippleVisualColor = bgVisualColor;
    let cols = 0;
    let rows = 0;
    let cells: Cell[][] = [];
    let centerShapeRadius = 0;

    const rotation = {
      dir: Math.random() < 0.5 ? -1 : 1,
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
      const detail = (e as CustomEvent).detail;
      const bg = typeof detail.bg === "string" ? detail.bg
        : typeof detail.color === "string" ? detail.color : null;
      if (!bg) return;
      bgVisualColor = bg;
      centerShapeColor = typeof detail.shape === "string" ? detail.shape : contrastShapeColor(bg);
      rippleVisualColor = typeof detail.ripple === "string" ? detail.ripple : bg;
      if (detail.transition) return;
      for (let row = 0; row < cells.length; row++) {
        for (let col = 0; col < cells[row].length; col++) cells[row][col].color = bg;
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
        color: typeof detail.color === "string" ? detail.color : rippleVisualColor,
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

      // ── 불가능 삼각형 자기장 준비 ──────────────────────────────
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R  = centerShapeRadius;
      const barSolidPx = Math.max(CELL * 0.6, R * BAR_SOLID_R);
      const barSolid2  = barSolidPx * barSolidPx;
      const fallPx     = R * FIELD_FALLOFF_R;
      const invFall2   = 1 / (fallPx * fallPx);
      const boundR     = R * FIELD_BOUND_R;
      const boundSq    = boundR * boundR;
      const rot  = time * ROT_SPEED * rotation.dir + rotation.offset;
      const bars = buildTriangleBars(cx, cy, R, rot, time, barSolidPx * BAR_OVERSHOOT);
      const b0 = bars[0], b1 = bars[1], b2 = bars[2];

      for (let row = 0; row < rows; row++) {
        const py = row * CELL + CELL / 2;
        const try0 = py - cy;
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

          // ── 자기장 영역 안이면 철가루 결을 그린다 ──────────────
          const trx = px - cx;
          if (trx * trx + try0 * try0 <= boundSq) {
            let fx = 0, fy = 0, near = 0;
            let s0 = false, s1 = false, s2 = false;
            let d2_0 = 0, d2_1 = 0, d2_2 = 0;

            for (let k = 0; k < 3; k++) {
              const s = k === 0 ? b0 : k === 1 ? b1 : b2;
              const sdx = s.x2 - s.x1, sdy = s.y2 - s.y1;
              let t = ((px - s.x1) * sdx + (py - s.y1) * sdy) / s.lenSq;
              t = t < 0 ? 0 : t > 1 ? 1 : t;
              const qx = s.x1 + t * sdx, qy = s.y1 + t * sdy;
              const rxv = px - qx, ryv = py - qy;
              const d2 = rxv * rxv + ryv * ryv;
              const w = 1 / (1 + d2 * invFall2);

              // 막대를 따라 흐르는 성분(tangent) + 휘감는 성분(curl)
              let perpx = 0, perpy = 0;
              if (d2 > 0.0001) {
                const invd = 1 / Math.sqrt(d2);
                perpx = -ryv * invd;
                perpy = rxv * invd;
              }
              fx += w * (s.tx * FIELD_TANGENT_W + perpx * FIELD_CURL_W);
              fy += w * (s.ty * FIELD_TANGENT_W + perpy * FIELD_CURL_W);
              near += w;

              if (d2 < barSolid2) {
                if (k === 0) { s0 = true; d2_0 = d2; }
                else if (k === 1) { s1 = true; d2_1 = d2; }
                else { s2 = true; d2_2 = d2; }
              }
            }

            // 순환 occlusion: 0이 1 위, 1이 2 위, 2가 0 위 → 비추이적 = 불가능
            const cnt = (s0 ? 1 : 0) + (s1 ? 1 : 0) + (s2 ? 1 : 0);
            let winner = -1;
            if (cnt === 1) winner = s0 ? 0 : s1 ? 1 : 2;
            else if (cnt === 2) winner = (s0 && s1) ? 0 : (s1 && s2) ? 1 : 2;
            else if (cnt === 3) winner = (d2_0 <= d2_1 && d2_0 <= d2_2) ? 0 : (d2_1 <= d2_2 ? 1 : 2);

            if (winner >= 0) {
              const wb = winner === 0 ? b0 : winner === 1 ? b1 : b2;
              cell.color = centerShapeColor;
              ctx.globalAlpha = BEAM_ALPHA;
              ctx.fillStyle = centerShapeColor;
              ctx.fillText(fieldChar(wb.tx, wb.ty), col * CELL, row * CELL);
              continue;
            }

            if (near > HALO_MIN && cell.ch !== " ") {
              cell.color = centerShapeColor;
              ctx.globalAlpha = Math.min(HALO_ALPHA_MAX, near * HALO_GAIN);
              ctx.fillStyle = centerShapeColor;
              ctx.fillText(fieldChar(fx, fy), col * CELL, row * CELL);
              continue;
            }
          }

          if (cell.ch === " ") continue;

          ctx.globalAlpha = Math.min(BACKGROUND_ALPHA_MAX, cell.alpha * BACKGROUND_ALPHA_MULT);
          ctx.fillStyle = cell.color;
          ctx.fillText(cell.ch, col * CELL, row * CELL);
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
