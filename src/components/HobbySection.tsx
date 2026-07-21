"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLanguage } from "@/i18n";
import { dispatchRipple } from "@/lib/ascii/events";

/*
 * 취미 섹션 — ECHO://DECODE
 *
 * 고래 사진을 벽지가 아니라 '수신된 심해 신호'로 다룬다. 사진은 먼저 배경
 * 캔버스와 같은 문법의 ASCII 글리프(0/1)로 응결되고, 고래 머리(음향 기관)에서
 * 발사된 소나 핑의 파면이 셀 단위로 글리프를 지우며 실사를 현상한다.
 * 그 핑은 dispatchRipple로 액자를 뚫고 실제 사이트 배경까지 퍼진다 —
 * 향유고래는 소리로 세상을 보는 동물이라, 이 연출은 장식이 아니라 헌사다.
 *
 * 코드베이스 원칙 준수: 연출은 유한하다. 끝나면 캔버스가 언마운트되고
 * 정적 <img> 한 장만 남아 프레임 비용이 0으로 수렴한다.
 */

// ── 앵커 (이미지 상대좌표 0~1) ────────────────────────────────────────
// 프레임이 aspect-[1305/910]으로 사진과 동일 비율이라 프레임 상대좌표와 같다.
// 사진을 교체하면 반드시 함께 갱신할 것. (object-cover로 바꾸면 전부 어긋난다)
const ORIGIN = { x: 0.2, y: 0.52 }; // 고래 머리 — 핑 발사점
const IMG_W = 1305;
const IMG_H = 910;
// 리더 라인: 라벨 → 대상. 이미지 픽셀 좌표계(viewBox).
// 끝점은 피사체 실루엣에 닿아야 한다 — 물속에서 끊기면 아무것도 가리키지 않는 선이 된다.
const LEADER_DIVER = { x1: 1030, y1: 762, x2: 690, y2: 455 }; // 우하단 라벨 → 다이버 몸통 바로 아래
const LEADER_WHALE = { x1: 200, y1: 770, x2: 480, y2: 498 }; // 좌하단 라벨 → 고래 아랫배 안쪽

const IMG_SRC = "/images/whale.webp";
const IMG_FALLBACK = "/images/whale.png"; // webp 미지원/실패 폴백

// ── 타임라인 (ms, T0 = 이미지 decode 완료) ───────────────────────────
const CLICK_AT = 350; // 0~350은 숨 참기(완전한 정적), 350~800 고래의 클릭 2회(시안 점멸)
const SCAN_AT = 750; //  핑 1: 파면이 지나간 자리에 ASCII 글리프가 찍힌다
const SCAN_MS = 1100;
const DECODE_AT = 2050; // 핑 2: 파면이 글리프를 지우며 실사를 현상한다
const DECODE_MS = 1050;
const SPARK_MS = 90; // 셀이 지워지기 직전 밝게 빛나는 시간
const MAX_SPARKS = 150; // 동시 스파크 상한 — easeOut 초반 폭주가 흰 원판으로 뭉개지는 것을 막는다
const FAST_DECODE_AT = 150; // 재방문 단축판: 스캔 생략, 디코드 1회
const FAST_DECODE_MS = 800;

const CELL = 8; // 글리프 셀 크기(css px) — 배경(6px)보다 약간 굵은 소나 해상도
const SEEN_KEY = "whale-decoded"; // 세션 내 재방문이면 단축판 재생

/** 어두움→밝음 글리프 램프. 최암부는 글리프를 찍지 않아 심연으로 남긴다. */
const RAMP = [".", ":", "/", "0", "1", "+"];
const NOISE_CHARS = ["0", "1", ".", ":", "/"];

/** PerkSection과 동일한 8비트 이징 — 진행도를 n단계로 양자화한다 */
const quantize = (n: number) => (p: number) => (p >= 1 ? 1 : Math.floor(p * n) / n);
/** 캔버스 파면 반지름용. 링 div의 ease [0.33,1,0.68,1]과 같은 곡선이어야 동기가 맞는다 */
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const RING_EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];

type Phase = "loading" | "reveal" | "settled" | "failed";

interface SonarCell {
  x: number;
  y: number;
  ch: string | null;
  color: string;
  dist: number;
}

// ── 소나 캔버스 헬퍼 ─────────────────────────────────────────────────

interface NoiseCell {
  x: number;
  y: number;
  ch: string;
  alpha: number;
}

/** 신호 대기 노이즈 셀 1회 생성 — T0 재페인트에서 같은 패턴을 유지하기 위해 분리 */
function makeNoise(w: number, h: number): NoiseCell[] {
  const cells: NoiseCell[] = [];
  for (let y = 0; y < h; y += CELL) {
    for (let x = 0; x < w; x += CELL) {
      if (Math.random() > 0.07) continue;
      cells.push({
        x,
        y,
        ch: NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)],
        alpha: 0.06 + Math.random() * 0.14,
      });
    }
  }
  return cells;
}

/** 신호 대기 화면: 배경 캔버스와 같은 문법의 정적 노이즈 한 장 (1회 페인트) */
function paintNoise(ctx: CanvasRenderingContext2D, w: number, h: number, cells: NoiseCell[]) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${CELL}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const c of cells) {
    ctx.fillStyle = `rgba(148, 197, 210, ${c.alpha})`;
    ctx.fillText(c.ch, c.x + CELL / 2, c.y + CELL / 2);
  }
}

/**
 * 사진을 셀 격자로 샘플링해 휘도→글리프 매핑을 만든다.
 * 거의 단색 파랑 사진이라 2%/98% 히스토그램 스트레치 + 감마 보정으로
 * 고래 등판의 형상을 살린다. 셀은 핑 원점 기준 거리순으로 정렬해
 * 파면을 넘은 셀만 프레임당 처리한다 (분할 상환).
 */
function buildCells(img: HTMLImageElement, w: number, h: number): SonarCell[] {
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true })!;
  octx.drawImage(img, 0, 0, cols, rows);
  const data = octx.getImageData(0, 0, cols, rows).data;

  const lums = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    lums[i] =
      (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  }
  const sorted = Array.from(lums).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  const range = Math.max(hi - lo, 0.001);

  const ox = w * ORIGIN.x;
  const oy = h * ORIGIN.y;
  const cells: SonarCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let l = (lums[row * cols + col] - lo) / range;
      l = Math.pow(Math.min(Math.max(l, 0), 1), 0.75);
      const x = col * CELL;
      const y = row * CELL;
      let ch: string | null = null;
      let color = "";
      if (l >= 0.06) {
        ch = RAMP[Math.min(RAMP.length - 1, Math.floor(((l - 0.06) / 0.94) * RAMP.length))];
        // 최명부(고래 등판 하이라이트)는 흰 기운, 나머지는 시안 — 사이트 액센트 그대로
        color =
          l > 0.82
            ? `rgba(220, 250, 255, ${0.5 + 0.5 * l})`
            : `rgba(34, 211, 238, ${0.25 + 0.6 * l})`;
      }
      cells.push({
        x,
        y,
        ch,
        color,
        dist: Math.hypot(x + CELL / 2 - ox, y + CELL / 2 - oy),
      });
    }
  }
  cells.sort((a, b) => a.dist - b.dist);
  return cells;
}

// ── 소나 프레임 ──────────────────────────────────────────────────────

function SonarFrame() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [fast, setFast] = useState(false);
  const [ringSize, setRingSize] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);

  // 마운트 1회: 대기 노이즈 → 이미지 decode → 소나 시퀀스
  useEffect(() => {
    let alive = true;
    let isFast = false;
    try {
      isFast = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    setFast(isFast);

    // 신호 대기 화면 (정적 1회 페인트 — 애니메이션 없음).
    // 노이즈 셀은 한 번만 뽑아 보관한다 — T0 재페인트에서 패턴이 재추첨되며
    // '숨 참기 정적' 직전에 화면 전체가 번쩍 뒤바뀌는 팝을 막기 위해서다.
    let noise: { w: number; h: number; cells: NoiseCell[] } | null = null;
    const noiseFor = (w: number, h: number) => {
      if (!noise || noise.w !== w || noise.h !== h) noise = { w, h, cells: makeNoise(w, h) };
      return noise.cells;
    };
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        paintNoise(ctx, rect.width, rect.height, noiseFor(rect.width, rect.height));
      }
    }

    const settle = () => {
      if (!alive) return;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setPhase("settled");
    };

    // 소나 리빌: 핑 1(스캔)이 글리프를 찍고, 핑 2(디코드)가 지우며 실사를 현상한다.
    // rAF 루프는 리빌 동안만 돌고, 프레임당 작업은 '이번 프레임에 파면을 넘은 셀'뿐이다.
    const beginReveal = (img: HTMLImageElement) => {
      const cv = canvasRef.current;
      if (reduced || !cv) {
        settle();
        return;
      }
      const rect = cv.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 40 || h < 40) {
        settle();
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const ctx = cv.getContext("2d");
      if (!ctx) {
        settle();
        return;
      }
      ctx.scale(dpr, dpr);
      paintNoise(ctx, w, h, noiseFor(w, h)); // 크기가 같으면 대기 화면과 동일 패턴
      ctx.font = `${CELL}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cells = buildCells(img, w, h);
      const maxR = cells[cells.length - 1].dist;
      setRingSize(maxR * 2);
      setPhase("reveal");

      const scanAt = isFast ? Infinity : SCAN_AT; // 단축판은 스캔 생략
      const decodeAt = isFast ? FAST_DECODE_AT : DECODE_AT;
      const decodeMs = isFast ? FAST_DECODE_MS : DECODE_MS;

      let i1 = 0; // 스캔 파면을 넘어 글리프가 찍힌 셀 수
      let i2 = 0; // 디코드 파면을 넘어 지워지기 시작한 셀 수
      let rippleFired = false;
      const sparks: { x: number; y: number; at: number }[] = [];
      const t0 = performance.now();

      const loop = (now: number) => {
        if (!alive) return;
        const t = now - t0;

        // 핑 1 — 스캔: 파면 뒤로 사진의 휘도가 ASCII 글리프로 찍힌다
        if (t >= scanAt && i1 < cells.length) {
          const r = maxR * easeOutCubic(Math.min((t - scanAt) / SCAN_MS, 1));
          while (i1 < cells.length && cells[i1].dist <= r) {
            const c = cells[i1++];
            if (c.ch) {
              ctx.fillStyle = c.color;
              ctx.fillText(c.ch, c.x + CELL / 2, c.y + CELL / 2);
            }
          }
        }

        // 핑 2 — 디코드: 셀이 한 번 밝게 빛나고(스파크) 지워지며 실사가 드러난다
        if (t >= decodeAt) {
          if (!rippleFired) {
            rippleFired = true;
            // 고래의 클릭이 액자를 뚫고 사이트 배경으로 — 기존 리플 버스 재사용.
            // 탭 비활성으로 wall-clock이 점프해 파면이 이미 지나간 뒤라면
            // 맥락 없는 리플이 되므로 발사하지 않는다.
            if (t - decodeAt < decodeMs) {
              const cr = cv.getBoundingClientRect();
              dispatchRipple({
                x: cr.left + cr.width * ORIGIN.x,
                y: cr.top + cr.height * ORIGIN.y,
                thin: true,
              });
            }
          }
          const r = maxR * easeOutCubic(Math.min((t - decodeAt) / decodeMs, 1));
          while (i2 < cells.length && cells[i2].dist <= r) {
            const c = cells[i2++];
            ctx.fillStyle = "rgba(190, 245, 255, 0.95)";
            ctx.fillText(c.ch ?? "+", c.x + CELL / 2, c.y + CELL / 2);
            sparks.push({ x: c.x, y: c.y, at: t });
          }
          while (
            sparks.length &&
            (sparks.length > MAX_SPARKS || t - sparks[0].at > SPARK_MS)
          ) {
            const s = sparks.shift()!;
            ctx.clearRect(s.x - 1, s.y - 1, CELL + 2, CELL + 2);
          }
        }

        // 진행률은 React 리렌더 없이 직접 갱신한다
        if (pctRef.current) {
          const total = isFast ? cells.length : cells.length * 2;
          const pct = Math.min(100, Math.round(((i1 + i2) / total) * 100));
          pctRef.current.textContent = `${pct}%`;
        }

        if (i2 >= cells.length && sparks.length === 0) {
          ctx.clearRect(0, 0, w, h); // 잔여 헤어라인까지 완전 제거
          settle();
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    // webp 우선, 실패 시 png 폴백. 성공/실패 판정은 onload/onerror로 하고
    // decode()는 베스트에포트로만 기다린다 — 미지원 브라우저의 동기 크래시와
    // Safari의 스퓨리어스 리젝션이 로드 성공을 실패로 오판하는 것을 막으면서,
    // 리빌 첫 프레임에 748KB급 디코드 잭이 끼는 것도 방지한다.
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => {
          const decoded =
            typeof im.decode === "function" ? im.decode().catch(() => {}) : Promise.resolve();
          decoded.then(() => resolve(im));
        };
        im.onerror = () => reject(new Error(`image load failed: ${src}`));
        im.src = src;
      });

    loadImage(IMG_SRC)
      .then((im) => {
        if (!alive) return;
        setImgSrc(IMG_SRC);
        beginReveal(im);
      })
      .catch(() =>
        loadImage(IMG_FALLBACK)
          .then((im) => {
            if (!alive) return;
            setImgSrc(IMG_FALLBACK);
            beginReveal(im);
          })
          .catch(() => alive && setPhase("failed")),
      );

    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
    // reduced는 마운트 시점 값만 쓴다 — 연출 중 OS 설정 변경까지 쫓지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const originPos = { left: `${ORIGIN.x * 100}%`, top: `${ORIGIN.y * 100}%` };

  return (
    <figure className="w-full">
      {/* 메타데이터 바 — 수신기 상태 표시 */}
      {/* 좁은 화면에선 문구를 줄이고 우측을 nowrap으로 고정 — 메타바가 2줄이 되며
          settled 전환 순간 프레임이 아래로 밀리는 레이아웃 점프를 막는다 */}
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] tracking-wider text-cyan-300/70 pb-1.5 px-0.5 select-none text-glow-none">
        <span className="min-w-0 truncate">
          <span className="hidden sm:inline">RX://whale_encounter.raw</span>
          <span className="sm:hidden">RX://whale.raw</span>
        </span>
        <span className="shrink-0 whitespace-nowrap tabular-nums">
          {phase === "loading" && (
            <>
              AWAITING SIGNAL<span className="blink-block">▌</span>
            </>
          )}
          {phase === "reveal" && (
            <>
              ECHOLOCATING ▸ <span ref={pctRef} className="tabular-nums">0%</span>
            </>
          )}
          {phase === "settled" && (
            <>
              <span className="hidden sm:inline">DECODE COMPLETE ▸ LEGENDARY</span>
              <span className="sm:hidden">DECODE ▸ LEGENDARY</span>
            </>
          )}
          {phase === "failed" && "SIGNAL LOST"}
        </span>
      </div>

      {/* 소나 뷰포트: 사이트에서 유일하게 풀컬러가 허락된 창 */}
      <div
        className="relative w-full overflow-hidden rounded-sm border border-cyan-400/25 shadow-[0_0_24px_rgba(6,182,212,0.10)] bg-[#0a0a0a]"
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            alt={t.hobby.photoAlt}
            width={IMG_W}
            height={IMG_H}
            draggable={false}
            className="absolute inset-0 w-full h-full"
          />
        )}

        {/* 디코드 캔버스 — 연출이 끝나면 언마운트되어 프레임 비용 0 */}
        {phase !== "settled" && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        )}

        {phase === "reveal" && (
          <>
            {/* 고래의 클릭 2회 — 숨 참기 뒤의 첫 교신 (단축판은 생략) */}
            {!fast && (
              <motion.span
                aria-hidden
                className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300"
                style={originPos}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1, 0] }}
                transition={{
                  delay: CLICK_AT / 1000,
                  duration: 0.45,
                  times: [0, 0.15, 0.4, 0.6, 0.9],
                }}
              />
            )}
            {/* 핑 1 — 스캔 파면 (캔버스 글리프와 같은 easeOutCubic으로 동기).
                센터링은 framer의 x/y로 해야 한다 — scale 애니메이션이 인라인
                transform을 통째로 새로 쓰는 순간 클래스 기반 translate가 소실된다 */}
            {!fast && (
              <motion.span
                aria-hidden
                className="absolute rounded-full border border-cyan-300/70"
                style={{ ...originPos, width: ringSize, height: ringSize, x: "-50%", y: "-50%" }}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{ delay: SCAN_AT / 1000, duration: SCAN_MS / 1000, ease: RING_EASE }}
              />
            )}
            {/* 핑 2 — 디코드 파면 (흰색: 음향이 시각으로 바뀌는 순간) */}
            <motion.span
              aria-hidden
              className="absolute rounded-full border-2 border-white/80"
              style={{ ...originPos, width: ringSize, height: ringSize, x: "-50%", y: "-50%" }}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{
                delay: (fast ? FAST_DECODE_AT : DECODE_AT) / 1000,
                duration: (fast ? FAST_DECODE_MS : DECODE_MS) / 1000,
                ease: RING_EASE,
              }}
            />
          </>
        )}

        {/* 경외의 마침표: 리더 라인 두 개가 주인공들을 짚는다 — 이름, 그리고 종.
            라벨이 짧아 모바일에서도 라인을 그대로 보여준다 (9px로만 축소) */}
        {phase === "settled" && (
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <svg
              viewBox={`0 0 ${IMG_W} ${IMG_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <motion.line
                x1={LEADER_DIVER.x1}
                y1={LEADER_DIVER.y1}
                x2={LEADER_DIVER.x2}
                y2={LEADER_DIVER.y2}
                stroke="rgba(165, 243, 252, 0.75)"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: reduced ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
              />
              <motion.line
                x1={LEADER_WHALE.x1}
                y1={LEADER_WHALE.y1}
                x2={LEADER_WHALE.x2}
                y2={LEADER_WHALE.y2}
                stroke="rgba(165, 243, 252, 0.75)"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: reduced ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
              />
            </svg>
            {/* 다이버 라벨은 선의 시작점에서 파생 — 선이 라벨의 좌상단 모서리에서
                자라나도록 살짝 우하단 오프셋을 준다. 좌표를 바꿔도 함께 따라온다 */}
            <motion.span
              className="absolute font-mono text-[9px] sm:text-[11px] text-cyan-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] whitespace-nowrap"
              style={{
                left: `${((LEADER_DIVER.x1 + 8) / IMG_W) * 100}%`,
                top: `${((LEADER_DIVER.y1 + 6) / IMG_H) * 100}%`,
              }}
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.35 }}
            >
              {t.hobby.diverLabel}
            </motion.span>
            <motion.span
              className="absolute font-mono text-[9px] sm:text-[11px] text-cyan-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] whitespace-nowrap"
              style={{ left: "8%", top: "86%" }}
              initial={{ opacity: reduced ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.35 }}
            >
              {t.hobby.whaleLabel}
            </motion.span>
          </div>
        )}
      </div>
    </figure>
  );
}

// ── 다이브 로그 (텍스트) ─────────────────────────────────────────────

// 줄 등장: 8비트 3단 점프 슬라이드 (PerkSection과 같은 사투리)
const lineVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.04 * i, duration: 0.3, ease: quantize(3) },
  }),
};

/**
 * freedivingContent를 줄 단위로 렌더한다. "- "로 시작하는 줄은 수심 레일의
 * 정거장(자격/이력 틱), 나머지는 산문. i18n 문자열의 "- " 접두 규칙에
 * 의존하므로 번역 형식을 바꾸면 여기도 함께 볼 것.
 */
function DiveLog({ content }: { content: string }) {
  const reduced = useReducedMotion();
  const lines = content.split("\n");
  return (
    <div className="relative mt-3 pl-5">
      {/* 수심 레일: 자격 목록은 사실상 하강 기록이다 (Indoor → Deep → Instructor) */}
      <motion.div
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-px origin-top bg-gradient-to-b from-cyan-400/60 via-cyan-400/25 to-transparent"
        initial={reduced ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-3" />;
        const isItem = line.startsWith("- ");
        return (
          <motion.div
            key={i}
            custom={i}
            variants={lineVariants}
            initial={reduced ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true }}
            className={isItem ? "relative py-0.5 text-gray-200" : "py-0.5 text-gray-300"}
          >
            {isItem ? (
              <>
                {/* 레일에서 뻗는 눈금 틱 */}
                <span
                  aria-hidden
                  className="absolute -left-5 top-[0.85em] w-2.5 h-px bg-cyan-400/50"
                />
                {line.slice(2)}
              </>
            ) : (
              line
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── 섹션 ─────────────────────────────────────────────────────────────

export default function HobbySection() {
  const { t } = useLanguage();
  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto px-8 py-4">
        <div className="pt-2">
          <SonarFrame />
        </div>

        <div className="pt-8 pb-4">
          <p className="font-mono text-[11px] tracking-[0.25em] text-cyan-300/60 select-none text-glow-none">
            {"// DIVE_LOG"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">{t.hobby.freedivingTitle}</h2>
          <DiveLog content={t.hobby.freedivingContent} />
        </div>

        <div className="py-6">
          <p className="font-mono text-[11px] text-cyan-300/60 select-none text-glow-none">
            {"> ls ./artworks --self-claimed"}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">{t.hobby.artTitle}</h2>
          {/* 농담은 맨몸일 때 가장 잘 터진다 — 장식 없이 그대로 */}
          <p className="mt-2 text-gray-300">{t.hobby.artContent}</p>
        </div>
      </div>
    </div>
  );
}
