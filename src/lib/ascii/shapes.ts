/**
 * ASCII 배경에 띄우는 3D 와이어프레임 도형 정의.
 *
 * 새 도형 추가 방법:
 *  1. build 함수를 만들어 ShapeDef를 반환한다 (정점은 대략 단위 구 안에 정규화).
 *  2. SHAPE_REGISTRY에 id와 함께 등록한다.
 *  3. 특정 곡에 고정하려면 bgmTracks.ts에서 shapeId로 지정한다.
 */

export type Vec3 = [number, number, number];

export interface ShapeDef {
  vertices: Vec3[];
  edges: [number, number][];
  /** 굵게 강조해 그릴 엣지 */
  accentEdges?: [number, number][];
  /** true면 세워둔 채 턴테이블 회전 (방향성 있는 도형용) */
  upright?: boolean;
  /** upright일 때 고정 기울기(rad). 미지정 시 은은한 흔들림 */
  tiltZ?: number;
  /** 이 도형만의 선 두께 배율 */
  edgeScale?: number;
  /** 이 도형만의 크기 배율 */
  scale?: number;
  /** true면 시점 반대편(뒤쪽) 엣지를 숨겨 입체감을 살린다 (볼록한 도형용) */
  cullBack?: boolean;
  /** true면 강착원반 모드: 고정 경사의 원반이 자기 축으로 자전한다 (projectShape의 disk 경로) */
  disk?: boolean;
  /** disk 모드 화면 경사각(rad). 0=정면, ~π/2=거의 edge-on */
  diskTilt?: number;
  /** disk 모드 자전 속도 배율 (블랙홀처럼 빠르게 돌릴 때 크게) */
  spin?: number;
  /** 0~1. 중심을 이 반경 비율만큼 어둡게 눌러 이벤트 호라이즌을 만든다 (AsciiBackground에서 처리) */
  coreFill?: number;
}

export type ShapeId =
  | "icosahedron"
  | "finalsLogo"
  | "hospitalCross"
  | "blackHole";

// ── 도형 빌더 ─────────────────────────────────────────────────────────

function buildIcosahedron(): ShapeDef {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: Vec3[] = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
    [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1],
  ];
  const verts: Vec3[] = raw.map((v) => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  });
  const edgeLen = (() => {
    const dx = verts[0][0] - verts[1][0];
    const dy = verts[0][1] - verts[1][1];
    const dz = verts[0][2] - verts[1][2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  })();
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const dx = verts[i][0] - verts[j][0];
      const dy = verts[i][1] - verts[j][1];
      const dz = verts[i][2] - verts[j][2];
      if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - edgeLen) < 0.01) edges.push([i, j]);
    }
  }
  return { vertices: verts, edges };
}

/**
 * 2D 외곽선을 z축으로 돌출시킨 각진 3D 와이어프레임.
 * outline은 y가 위쪽인 좌표계로 정의한다 (내부에서 화면 좌표계로 뒤집는다).
 */
function buildExtruded(outline: [number, number][], depth: number, opts: Partial<ShapeDef> = {}): ShapeDef {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const half = depth / 2;

  const raw: Vec3[] = [
    ...outline.map(([x, y]): Vec3 => [x - cx, -(y - cy), half]),
    ...outline.map(([x, y]): Vec3 => [x - cx, -(y - cy), -half]),
  ];
  let maxLen = 0;
  for (const v of raw) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len > maxLen) maxLen = len;
  }
  const vertices: Vec3[] = raw.map((v) => [v[0] / maxLen, v[1] / maxLen, v[2] / maxLen]);

  const n = outline.length;
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    edges.push([i, (i + 1) % n]);         // 앞면 외곽
    edges.push([n + i, n + ((i + 1) % n)]); // 뒷면 외곽
    edges.push([i, n + i]);               // 옆면 연결선
  }
  return { vertices, edges, ...opts };
}

/** THE FINALS 풍의 각진 'F' 로고 (살짝 기울어진 이탤릭) */
function buildFinalsLogo(): ShapeDef {
  const outline: [number, number][] = [
    [0, 0], [0, 1], [0.62, 1], [0.62, 0.78],
    [0.24, 0.78], [0.24, 0.56], [0.54, 0.56], [0.54, 0.34],
    [0.24, 0.34], [0.24, 0],
  ].map(([x, y]) => [x + 0.18 * y, y]); // 이탤릭 시어

  // THE FINALS 로고처럼 옆으로 비스듬히 눕힌다
  return buildExtruded(outline, 0.28, { upright: true, tiltZ: 0.55, scale: 0.95, edgeScale: 0.85 });
}

/** 병원 십자가(+) 3D */
function buildHospitalCross(): ShapeDef {
  const a = 0.35;
  const outline: [number, number][] = [
    [-a, 1], [a, 1], [a, a], [1, a], [1, -a], [a, -a],
    [a, -1], [-a, -1], [-a, -a], [-1, -a], [-1, a], [-a, a],
  ];
  // 세워둔 채 돌려야 어느 순간에도 +로 읽힌다
  return buildExtruded(outline, 0.34, { upright: true, scale: 0.9 });
}

/**
 * 블랙홀: 고정 경사로 눕힌 강착원반(accretion disk)이 자기 축을 중심으로 아주 빠르게 자전한다.
 * - 나선팔(spiral arm)이 회전을 눈에 보이게 하고 안쪽으로 빨려드는 강착 느낌을 준다.
 *   (완벽한 동심원은 회전 대칭이라 아무리 돌려도 정지해 보인다 → 나선으로 대칭을 깬다)
 * - 안쪽이 비어 있어(이벤트 호라이즌) 어두운 중심 + 밝은 광자 링(안쪽 accent 링)으로 읽힌다.
 * 원반은 XY 평면에 납작하게(z=0) 정의하고, projectShape의 disk 경로가 자전→경사 순으로 변환한다.
 */
function buildBlackHole(): ShapeDef {
  const verts: Vec3[] = [];
  const edges: [number, number][] = [];
  const accent: [number, number][] = [];

  const R_IN = 0.5;   // 이벤트 호라이즌/광자 링 반경
  const R_OUT = 1.0;  // 강착원반 바깥 반경

  // dashOn/dashOff를 주면 링을 끊어 호(arc)로 만든다. 완전한 원은 회전 대칭이라
  // 아무리 돌려도 정지해 보이므로, 바깥 링들은 끊어 회전이 눈에 보이게 한다.
  const ring = (radius: number, segs: number, opts: { accent?: boolean; dashOn?: number; dashOff?: number } = {}) => {
    const start = verts.length;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      verts.push([Math.cos(a) * radius, Math.sin(a) * radius, 0]);
    }
    const period = (opts.dashOn ?? 0) + (opts.dashOff ?? 0);
    for (let i = 0; i < segs; i++) {
      if (period > 0 && i % period >= (opts.dashOn ?? 0)) continue; // 이 구간은 띄운다
      (opts.accent ? accent : edges).push([start + i, start + ((i + 1) % segs)]);
    }
  };

  // 동심 링 3개: 안쪽=광자 링(솔리드·강조), 바깥 둘은 끊어 회전을 드러낸다.
  ring(R_IN, 44, { accent: true });
  ring((R_IN + R_OUT) / 2, 48, { dashOn: 5, dashOff: 2 });
  ring(R_OUT, 54, { dashOn: 6, dashOff: 3 });

  // 나선팔: 안→밖으로 감기는 로그풍 나선. 팔마다 시작각을 균등 분배한다.
  const ARMS = 5;
  const STEPS = 18;
  const TWIST = 3.6; // 팔 하나가 안에서 밖까지 감기는 총 각(rad) — 클수록 소용돌이가 강하다
  for (let arm = 0; arm < ARMS; arm++) {
    const base = (arm / ARMS) * Math.PI * 2;
    let prev = -1;
    for (let s = 0; s <= STEPS; s++) {
      const f = s / STEPS;
      const r = R_IN + (R_OUT - R_IN) * f;
      const a = base + f * TWIST;
      verts.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
      const idx = verts.length - 1;
      if (prev >= 0) edges.push([prev, idx]);
      prev = idx;
    }
  }

  return {
    vertices: verts,
    edges,
    accentEdges: accent,
    disk: true,
    diskTilt: 1.1,   // 화면 경사(rad). 살짝 더 열어 소용돌이가 잘 보이게
    spin: 8,         // 자전 속도 배율 — 아주 빠르게 (약 1.5 rev/s, 스트로빙 없음)
    coreFill: 0.26,  // 이벤트 호라이즌 지름(반경비). 광자 링을 덜 가리도록 축소
    edgeScale: 0.72,
  };
}

// ── 레지스트리 ────────────────────────────────────────────────────────

export const SHAPE_REGISTRY: Record<ShapeId, ShapeDef> = {
  icosahedron: buildIcosahedron(),
  finalsLogo: buildFinalsLogo(),
  hospitalCross: buildHospitalCross(),
  blackHole: buildBlackHole(),
};

/** "random" 테마에서 뽑는 풀 — 모든 도형이 후보다 (특정 곡 고정은 bgmTracks.ts에서만 한다) */
export const RANDOM_SHAPE_POOL: ShapeId[] = Object.keys(SHAPE_REGISTRY) as ShapeId[];

export function randomShapeId(exclude?: ShapeId): ShapeId {
  const pool = RANDOM_SHAPE_POOL.filter((id) => id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 3D 투영 ──────────────────────────────────────────────────────────

export interface RotationConfig {
  x: number;
  y: number;
  z: number;
  offset: number;
}

export function randomRotation(): RotationConfig {
  return {
    x: (Math.random() < 0.5 ? -1 : 1) * (1.15 + Math.random() * 0.5),
    y: (Math.random() < 0.5 ? -1 : 1) * (1.35 + Math.random() * 0.55),
    z: (Math.random() < 0.5 ? -1 : 1) * (0.95 + Math.random() * 0.45),
    offset: Math.random() * Math.PI * 2,
  };
}

function rotate3D(
  x: number, y: number, z: number,
  rx: number, ry: number, rz: number,
): Vec3 {
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

export type Segment = [number, number, number, number];

export interface ProjectedShape {
  main: Segment[];
  accent: Segment[];
}

/** 전체 회전 속도 배율 (1 = 기존 속도) */
const SPIN_SPEED = 1.18;

/** 도형을 회전시켜 화면 좌표의 선분 목록으로 투영한다. */
export function projectShape(
  def: ShapeDef,
  time: number,
  cx: number,
  cy: number,
  radius: number,
  rotation: RotationConfig,
): ProjectedShape {
  const t = time * SPIN_SPEED;

  // ── 블랙홀 강착원반: 원반 평면(XY)에서 빠르게 자전 → 고정 경사로 눕힌다 ──
  if (def.disk) {
    const dir = rotation.y >= 0 ? 1 : -1;
    const ang = t * dir * (def.spin ?? 1);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // 아주 미세한 세차(precession)로 살아있는 느낌만 준다
    const tilt = (def.diskTilt ?? 1.15) + 0.05 * Math.sin(t * 0.25);
    const ct = Math.cos(tilt);

    const pts: [number, number][] = [];
    for (const [x0, y0] of def.vertices) {
      // 자전(Z축) 후 X축 기준 경사. 정점이 z=0 이므로 경사의 z항은 생략된다.
      const x = x0 * ca - y0 * sa;
      const y = x0 * sa + y0 * ca;
      pts.push([cx + x * radius, cy + y * ct * radius]);
    }
    const mapDisk = (list: [number, number][] | undefined): Segment[] => {
      const out: Segment[] = [];
      if (!list) return out;
      for (const [i, j] of list) out.push([pts[i][0], pts[i][1], pts[j][0], pts[j][1]]);
      return out;
    };
    return { main: mapDisk(def.edges), accent: mapDisk(def.accentEdges) };
  }

  // upright 도형은 세워둔 채 수직축으로만 돌리고 살짝 끄덕이게 한다
  const rx = def.upright ? 0.2 * Math.sin(t * 0.4) : t * rotation.x + rotation.offset;
  const ry = def.upright
    ? t * rotation.y * 0.45 + rotation.offset
    : t * rotation.y + rotation.offset * 0.7;
  const rz = def.upright
    ? (def.tiltZ ?? 0.08 * Math.sin(t * 0.3))
    : t * rotation.z + rotation.offset * 1.3;

  const pts: [number, number][] = [];
  const depths: number[] = [];
  for (const [x0, y0, z0] of def.vertices) {
    const [x, y, z] = rotate3D(x0, y0, z0, rx, ry, rz);
    pts.push([cx + x * radius, cy + y * radius]);
    depths.push(z);
  }

  const mapEdges = (list: [number, number][] | undefined) => {
    const out: Segment[] = [];
    if (!list) return out;
    for (const [i, j] of list) {
      // 볼록 도형은 표면 위치 ≈ 법선이므로, 뒤를 향한 엣지는 숨긴다
      // (실루엣 경계가 남도록 약간의 여유를 둔다)
      if (def.cullBack && (depths[i] + depths[j]) / 2 < -0.06) continue;
      out.push([pts[i][0], pts[i][1], pts[j][0], pts[j][1]]);
    }
    return out;
  };
  return { main: mapEdges(def.edges), accent: mapEdges(def.accentEdges) };
}
