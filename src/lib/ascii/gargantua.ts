/**
 * 아스키 글리프 블랙홀(인터스텔라 Gargantua) 렌더러.
 * wooo 프로젝트의 gargantua.ts에서 배경 장면(idle)만 가져온 버전 —
 * 급식 구체·조석 파괴 연출은 이 프로젝트에서 쓰지 않으므로 뺐다.
 *
 * 구성: 렌즈 호(뒤편 디스크의 중력렌즈 상) + 앞을 가로지르는 디스크 띠
 * + 아래 반원 헤일로/광자 링 + 형형색색 별가루 · 성운 · 별똥별 배경.
 * 색은 트랙 테마와 무관하게 고정 팔레트(WARM 등)로 그린다.
 *
 * 주의: 별똥별이 모듈 레벨 상태라 캔버스 인스턴스는 페이지당 1개를 권장.
 */

const TAU = Math.PI * 2;

// 강착원반 색 램프 (차가움 → 뜨거움)
const WARM = ["#7a300f", "#b5501a", "#e86818", "#f59a34", "#ffbe6e", "#ffe0ad", "#fff4e0"];

const GLYPH_RAMP = [".", ":", "+", "*", "o", "O", "0", "@"];

const rampChar = (b: number) =>
  GLYPH_RAMP[Math.max(0, Math.min(GLYPH_RAMP.length - 1, Math.floor(b * GLYPH_RAMP.length)))];

interface DiskP { rr: number; phi: number; j: number; }
interface OrbitP { rr: number; ang: number; tw: number; }
export interface GargantuaParticles {
  disk: DiskP[];
  halo: OrbitP[];
  ring: OrbitP[];
  /** 위 반원 주변을 떠다니는 가루 */
  dust: OrbitP[];
}

export function seedGargantua(): GargantuaParticles {
  const disk: DiskP[] = Array.from({ length: 2200 }, () => {
    const u = Math.random();
    return { rr: 1.1 + (4.3 - 1.1) * Math.pow(u, 1.4), phi: Math.random() * TAU, j: Math.random() };
  });
  const halo: OrbitP[] = Array.from({ length: 280 }, () => {
    const u = Math.random();
    return { rr: 1.04 + (1.22 - 1.04) * Math.pow(u, 2.1), ang: Math.random() * TAU, tw: Math.random() * TAU };
  });
  const ring: OrbitP[] = Array.from({ length: 220 }, (_, i) => ({
    ang: (i / 220) * TAU, rr: 1.015 + Math.random() * 0.05, tw: Math.random() * TAU,
  }));
  const dust: OrbitP[] = Array.from({ length: 300 }, () => {
    const u = Math.random();
    return { rr: 1.04 + (1.35 - 1.04) * Math.pow(u, 2.2), ang: Math.random() * TAU, tw: Math.random() * TAU };
  });
  return { disk, halo, ring, dust };
}

// ── 은하수 별가루 배경 ───────────────────────────────────────────────

export interface Star {
  x: number; y: number;
  a: number;        // 기본 알파
  ph: number;       // 반짝임 위상
  spd: number;      // 반짝임 속도
  f: number;        // 폰트 크기(px)
  color: string;
  ch: string;
}

// 형형색색 별가루 — 빨강·파랑·초록·청록·노랑·주황·보라·흰색
const STAR_COLORS = [
  "#ff5a5a", "#ff8a4d", "#ffe066", "#5ade7a", "#4adcff",
  "#4a7dff", "#b07aff", "#ff7ab8", "#ffffff", "#dfe8ff",
];
const DUST_COLORS = [
  "#e06a6a", "#d9a05a", "#d9d06a", "#6ac98a", "#6ab8d9",
  "#7a8ad9", "#a98ad9", "#c8d4e8", "#b9c8e0",
];

/** 대략적인 가우시안 (-0.5 ~ 0.5) */
const gauss = () => (Math.random() + Math.random() + Math.random()) / 3 - 0.5;

export function seedStars(w: number, h: number): Star[] {
  const stars: Star[] = [];

  // 은하수 띠 — 화면을 비스듬히 가로지르는 미세한 별가루 (밀도 낮게)
  const bandAng = -0.38;
  const dx = Math.cos(bandAng), dy = Math.sin(bandAng);
  const diag = Math.hypot(w, h) * 1.2;
  const bandN = Math.round((w * h) / 3000);
  for (let i = 0; i < bandN; i++) {
    const along = (Math.random() - 0.5) * diag;
    const off = gauss() * h * 0.34;
    stars.push({
      x: w / 2 + dx * along - dy * off,
      y: h / 2 + dy * along + dx * off,
      a: 0.07 + Math.random() * 0.16,
      ph: Math.random() * TAU,
      spd: 0.3 + Math.random() * 0.5,
      f: 7,
      color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
      ch: ".",
    });
  }

  // 일반 별 — 살짝 더 밝고 색·크기 다양
  const n = Math.round((w * h) / 4600);
  for (let i = 0; i < n; i++) {
    const roll = Math.random();
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      a: 0.12 + Math.random() * 0.38,
      ph: Math.random() * TAU,
      spd: 0.6 + Math.random() * 1.1,
      f: 9,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      ch: roll < 0.04 ? "*" : roll < 0.1 ? "+" : ".",
    });
  }

  // 글린트 별 — 드문드문 크고 밝게 반짝이는 주인공들
  const glintN = 14 + Math.round((w * h) / 160000);
  const GLINT_COLORS = ["#ffffff", "#cfe4ff", "#9ad4ff", "#ffd9a0", "#ff8a8a", "#8affb0", "#d0a3ff"];
  for (let i = 0; i < glintN; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      a: 0.5 + Math.random() * 0.35,
      ph: Math.random() * TAU,
      spd: 0.9 + Math.random() * 1.4,
      f: 13,
      color: GLINT_COLORS[Math.floor(Math.random() * GLINT_COLORS.length)],
      ch: "+",
    });
  }

  // 폰트 전환을 줄이기 위해 크기별로 정렬해 둔다
  stars.sort((s1, s2) => s1.f - s2.f);
  return stars;
}

// ── 성운 — 화면 뒤에 깔리는 커다란 색 구름 ──────────────────────────

export interface Nebula {
  x: number; y: number; r: number;
  rot: number;
  sx: number; // 타원 비율 (길쭉함)
  color: [number, number, number];
  a: number;
  ph: number;
}

const NEBULA_COLORS: [number, number, number][] = [
  [96, 58, 168],   // 보라
  [46, 84, 178],   // 인디고
  [24, 118, 138],  // 청록
  [150, 52, 122],  // 마젠타
];

export function seedNebulas(w: number, h: number): Nebula[] {
  return Array.from({ length: 4 }, (_, i) => ({
    x: (0.12 + 0.76 * Math.random()) * w,
    y: (0.1 + 0.8 * Math.random()) * h,
    r: Math.min(w, h) * (0.28 + Math.random() * 0.3),
    rot: Math.random() * Math.PI,
    sx: 1.4 + Math.random() * 1.2,
    color: NEBULA_COLORS[i % NEBULA_COLORS.length],
    a: 0.055 + Math.random() * 0.05,
    ph: Math.random() * TAU,
  }));
}

function drawNebulas(ctx: CanvasRenderingContext2D, nebulas: Nebula[], t: number) {
  for (const nb of nebulas) {
    const pulse = 1 + 0.22 * Math.sin(t * 0.16 + nb.ph);
    const [r, g, b] = nb.color;
    ctx.save();
    ctx.translate(nb.x, nb.y);
    ctx.rotate(nb.rot);
    ctx.scale(nb.sx, 1);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, nb.r);
    grad.addColorStop(0, `rgba(${r},${g},${b},${(nb.a * pulse).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${r},${g},${b},${(nb.a * pulse * 0.4).toFixed(3)})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(-nb.r, -nb.r, nb.r * 2, nb.r * 2);
    ctx.restore();
  }
}

// ── 별똥별 — 형형색색 꼬리를 그리며 자주 떨어진다 ────────────────────

interface Meteor { x: number; y: number; vx: number; vy: number; born: number; color: string; }

const METEOR_COLORS = ["#bfe9ff", "#ffd9a0", "#ffb0b0", "#b0ffcf", "#d0b8ff", "#fff3b0"];
let meteors: Meteor[] = [];
let nextMeteorAt = 0;
const METEOR_LIFE = 1.1;

function drawMeteor(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  if (nextMeteorAt === 0) nextMeteorAt = t + 1 + Math.random() * 2;
  // 동시에 최대 3개까지, 짧은 간격으로 계속 태어난다
  if (t >= nextMeteorAt && meteors.length < 3) {
    const goRight = Math.random() < 0.5;
    meteors.push({
      x: w * (0.1 + Math.random() * 0.8),
      y: h * Math.random() * 0.45,
      vx: (goRight ? 1 : -1) * w * (0.3 + Math.random() * 0.25),
      vy: h * (0.15 + Math.random() * 0.15),
      born: t,
      color: METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)],
    });
    nextMeteorAt = t + 2 + Math.random() * 4;
  }
  if (meteors.length === 0) return;

  ctx.globalCompositeOperation = "lighter";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const m of meteors) {
    const age = t - m.born;
    if (age > METEOR_LIFE) continue;
    const hx = m.x + m.vx * age;
    const hy = m.y + m.vy * age;
    const len = Math.hypot(m.vx, m.vy);
    const ux = m.vx / len, uy = m.vy / len;
    const fade = 1 - age / METEOR_LIFE;
    for (let i = 0; i < 9; i++) {
      const px = hx - ux * i * 13;
      const py = hy - uy * i * 13;
      ctx.fillStyle = i === 0 ? "#ffffff" : m.color;
      ctx.globalAlpha = fade * (1 - i / 9) * 0.85;
      ctx.fillText(i === 0 ? "*" : ".", px, py);
    }
  }
  meteors = meteors.filter((m) => t - m.born <= METEOR_LIFE);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

const GARGANTUA_SPIN = 1.6;
/** 위 반원 가루의 각속도 (rad/s) — 렌즈 호의 평균 겉보기 속도와 맞춤 */
const HALO_SPEED_TOP = 0.9;
/** 아래 반원(헤일로·광자 링)의 각속도 — 위보다 느긋하게 */
const HALO_SPEED_BOTTOM = 0.45;
/** 원반 기울기(rad). π/2=완전 옆모습(edge-on) — 1.51 ≈ 86.5°, 거의 옆에서 본다 */
const GARGANTUA_TILT = 1.51;
/** 화면상 롤 기울임 — 우측으로 15도 */
const GARGANTUA_ROLL = (15 * Math.PI) / 180;
/** 원반 입자가 블랙홀로 흘러드는 속도 (R단위/초) — 강착 */
const DISK_INFLOW = 0.045;
const DISK_R_IN = 1.1;
const DISK_R_OUT = 4.3;

export function blackHoleRadius(w: number, h: number): number {
  return Math.min(w, h) * 0.16;
}

function drawGargantua(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number, t: number,
  P: GargantuaParticles,
) {
  const cosI = Math.cos(GARGANTUA_TILT);
  const shRx = 1.0 * R, shRy = 0.95 * R;
  ctx.font = `${Math.max(9, R * 0.08)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 이벤트 호라이즌 그림자
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(cx, cy, shRx, shRy, 0, 0, TAU);
  ctx.fill();

  ctx.globalCompositeOperation = "lighter";
  const buckets: number[][] = WARM.map(() => []);
  const put = (temp: number, sx: number, sy: number, b: number) =>
    buckets[Math.max(0, Math.min(WARM.length - 1, Math.floor(temp * WARM.length)))].push(sx, sy, b);

  // 강착원반 — 하나의 폐순환. 입자의 궤도 앞쪽 반 바퀴는 납작한 띠(오른쪽→왼쪽)로,
  // 뒤쪽 반 바퀴는 중력렌즈로 그림자 위에 감아올린 위쪽 호(왼쪽→오른쪽)로 그린다.
  // 즉 같은 입자가 위 호를 타고 오른쪽으로 내려와 앞 띠를 지나 왼쪽에서 다시 올라간다.
  // 입자는 서서히 안쪽으로 흘러들고(강착) 지평선을 넘으면 바깥에서 다시 태어난다.
  const span = DISK_R_OUT - DISK_R_IN;
  for (const p of P.disk) {
    const rr = DISK_R_IN + ((((p.rr - DISK_R_IN) - DISK_INFLOW * t) % span) + span) % span;
    const phi = p.phi - GARGANTUA_SPIN * Math.pow(rr, -1.5) * t;
    const phiN = ((phi % TAU) + TAU) % TAU;
    const c = Math.cos(phiN), s = Math.sin(phiN);

    let sx = cx + rr * R * c;
    let sy;
    let lensBoost = 1;

    if (s > 0) {
      // 뒤편 반 바퀴 — 렌즈된 상. 블랙홀에 가까울수록(w→1) 위쪽 호에 붙는다.
      sy = cy + rr * R * s * cosI;
      // 전환 구간을 좁혀(rr≈1.3~2.0) 합류부 부채꼴이 얇아진다
      const w = Math.max(0, Math.min(1, 2.9 - 1.45 * rr));
      // 뒤편 진행도: 왼쪽 진입(φ=π)=0 → 오른쪽 이탈(φ=0)=1
      const g = 1 - phiN / Math.PI;
      const arcAng = Math.PI * (1 + g); // π→2π: 왼쪽 → 꼭대기 → 오른쪽
      // 호는 링에 바짝 붙는다 (1.03R ~ 1.17R)
      const arcR = R * (1.03 + 0.06 * (rr - DISK_R_IN));
      const arcX = cx + arcR * Math.cos(arcAng);
      const arcY = cy + arcR * 0.95 * Math.sin(arcAng);
      sx += (arcX - sx) * w;
      sy += (arcY - sy) * w;
      lensBoost = 1 + 0.4 * w; // 렌즈 증폭 — 호가 띠보다 살짝 밝다

      // 뒤편만 그림자에 가려진다
      const nx = (sx - cx) / shRx, ny = (sy - cy) / shRy;
      if (nx * nx + ny * ny < 1) continue;
    } else {
      // 앞쪽 반 바퀴 — 그림자 '앞'을 또렷하게 가로지르는 띠.
      // 모자챙처럼 중심 살짝 아래로 늘어지며, 절대 가려지지 않는다.
      sy = cy + rr * R * (-s) * cosI;
      lensBoost = 1.3;
    }

    // 역회전이므로 다가오는 쪽(밝은 쪽)은 오른쪽
    const dopp = 1 + 0.55 * c;
    const fall = Math.max(0, 1 - (rr - DISK_R_IN) / span);
    let b = (0.2 + 0.8 * fall) * dopp * (0.85 + 0.3 * p.j) * lensBoost;
    if (b < 0.1) continue;
    b = Math.min(1, b);
    // 색은 거리 그라디언트가 지배한다: 바깥 = 어두운 주황, 안쪽 = 밝은 크림색
    put(Math.min(1, Math.max(0, 0.1 + 0.82 * fall + 0.08 * c)), sx, sy, b);
  }

  // 렌즈 헤일로 — 아래 반원 전용. 시계방향 한 방향으로만 돌다가
  // 디스크 근처에만 가도 굴절되듯 밀려나며 블랙아웃된다. 위쪽은 렌즈된 원반이 담당.
  const rotBottom = t * HALO_SPEED_BOTTOM;
  for (const p of P.halo) {
    const ang = p.ang + rotBottom, rr = p.rr;
    const sinA = Math.sin(ang);
    if (sinA < 0.38) continue; // 디스크 평면에서 ±22°까지 블랙아웃 — 절단면을 넓게
    const edge = Math.min(1, (sinA - 0.38) / 0.3); // 경계에서 서서히 소멸
    // 굴절: 경계에 다가갈수록 바깥으로 밀려나며 흔들린다
    const bend = (1 - edge) * R * 0.1;
    const jitterA = (1 - edge) * 0.04 * Math.sin(t * 7 + p.tw * 13);
    const rad = rr * R + bend;
    const sx = cx + rad * Math.cos(ang + jitterA);
    const sy = cy + rad * Math.sin(ang + jitterA) * 0.95;
    const flow = 1 + 0.22 * sinA; // 아래쪽(화면 하단)이 더 살아있다
    const tw = 0.72 + 0.28 * Math.sin(t * 1.6 + p.tw);
    const inner = 1 - (rr - 1.04) / (1.22 - 1.04);
    const b = (0.4 + 0.6 * inner) * flow * tw * edge;
    if (b < 0.16) continue;
    put(Math.min(1, 0.58 + inner * 0.5), sx, sy, Math.min(1, b));
  }

  // 위 반원 주변을 떠다니는 가루 — 렌즈 호와 같은 속도·방향(시계방향)으로 돌고,
  // 디스크 평면 근처에서는 마찬가지로 소멸한다.
  const rotTop = t * HALO_SPEED_TOP;
  for (const p of P.dust) {
    const ang = p.ang + rotTop, rr = p.rr;
    const sinA = Math.sin(ang);
    if (sinA > -0.05) continue; // 위 반원만
    const edge = Math.min(1, (-sinA - 0.05) / 0.25);
    const sx = cx + rr * R * Math.cos(ang);
    const sy = cy + rr * R * sinA * 0.95;
    const tw = 0.6 + 0.4 * Math.sin(t * 1.9 + p.tw);
    const inner = 1 - (rr - 1.04) / (1.35 - 1.04);
    const b = (0.22 + 0.5 * inner) * tw * edge;
    if (b < 0.12) continue;
    put(Math.min(1, 0.5 + inner * 0.45), sx, sy, Math.min(1, b));
  }

  // 광자 링 — 아래 반원만. 헤일로와 같은 속도로 돌다가 디스크 평면 근처에서 소멸한다.
  const hot = (t * HALO_SPEED_BOTTOM) % TAU;
  for (const p of P.ring) {
    const ang = p.ang + t * HALO_SPEED_BOTTOM;
    const sinA = Math.sin(ang);
    if (sinA < 0.3) continue;
    const edge = Math.min(1, (sinA - 0.3) / 0.27);
    const sx = cx + p.rr * R * Math.cos(ang);
    const sy = cy + p.rr * R * sinA * 0.95;
    const d = Math.abs(((ang - hot + Math.PI) % TAU) - Math.PI);
    const spot = 1 + 0.5 * Math.max(0, 1 - d / 0.6);
    const b = Math.min(1, (0.82 + 0.18 * Math.sin(t * 3 + p.tw)) * spot) * edge;
    if (b < 0.1) continue;
    buckets[WARM.length - 1].push(sx, sy, b);
  }

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

/** 매 프레임 블랙홀 장면 전체(배경 포함)를 그린다. now는 performance.now() (ms). */
export function drawGargantuaScene(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  now: number,
  particles: GargantuaParticles,
  stars: Star[],
  nebulas: Nebula[],
) {
  const t = now / 1000;
  const cx = w / 2, cy = h / 2;
  const R = blackHoleRadius(w, h);

  // 우주 배경
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#05060a";
  ctx.fillRect(0, 0, w, h);

  // 성운 — 은은하게 숨쉬는 색 구름
  drawNebulas(ctx, nebulas, t);

  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4 * R);
  haze.addColorStop(0, "rgba(50,26,12,0.25)");
  haze.addColorStop(1, "rgba(50,26,12,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  // 은하수 별가루 (크기별로 정렬돼 있어 폰트 전환 최소)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let curFont = 0;
  for (const s of stars) {
    if (s.f !== curFont) {
      curFont = s.f;
      ctx.font = `${s.f}px monospace`;
    }
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(t * s.spd + s.ph));
    ctx.fillText(s.ch, s.x, s.y);
  }
  ctx.globalAlpha = 1;

  // 별똥별
  drawMeteor(ctx, w, h, t);

  // 블랙홀 — 우측으로 15도 기울여 그린다
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(GARGANTUA_ROLL);
  ctx.translate(-cx, -cy);
  drawGargantua(ctx, cx, cy, R, t, particles);
  ctx.restore();

  // 비네트
  ctx.globalCompositeOperation = "source-over";
  const vig = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.35, cx, cy, Math.max(w, h) * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
