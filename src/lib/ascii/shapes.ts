/**
 * ASCII 배경에 띄우는 3D 와이어프레임 도형 정의.
 *
 * 새 도형 추가 방법:
 *  1. build 함수를 만들어 ShapeDef를 반환한다 (정점은 대략 단위 구 안에 정규화).
 *  2. SHAPE_REGISTRY에 id와 함께 등록한다.
 *  3. 특정 곡에 고정하려면 bgmThemes.ts에서 shapeId로 지정한다.
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
}

export type ShapeId =
  | "icosahedron"
  | "globe"
  | "finalsLogo"
  | "hospitalCross";

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

/** 위도 링 + 경도선이 있는 와이어프레임 지구본. 축이 23.5° 기울어진 채 자전한다. */
function buildGlobe(): ShapeDef {
  const RINGS = 7;
  const RING_SEGS = 28;
  const MERIDIANS = 12;
  const MERIDIAN_STEPS = 14;

  const verts: Vec3[] = [];
  const edges: [number, number][] = [];

  const push = (th: number, ph: number): number => {
    verts.push([
      Math.sin(th) * Math.sin(ph),
      -Math.cos(th),
      Math.sin(th) * Math.cos(ph),
    ]);
    return verts.length - 1;
  };

  // 위도 링
  for (let i = 1; i <= RINGS; i++) {
    const th = (i / (RINGS + 1)) * Math.PI;
    const start = verts.length;
    for (let j = 0; j < RING_SEGS; j++) push(th, (j / RING_SEGS) * Math.PI * 2);
    for (let j = 0; j < RING_SEGS; j++) {
      edges.push([start + j, start + ((j + 1) % RING_SEGS)]);
    }
  }
  // 경도선 (극점 포함)
  for (let m = 0; m < MERIDIANS; m++) {
    const ph = (m / MERIDIANS) * Math.PI * 2;
    let prev = -1;
    for (let s = 0; s <= MERIDIAN_STEPS; s++) {
      const cur = push((s / MERIDIAN_STEPS) * Math.PI, ph);
      if (prev >= 0) edges.push([prev, cur]);
      prev = cur;
    }
  }

  return { vertices: verts, edges, upright: true, tiltZ: -0.41, cullBack: true, edgeScale: 0.5 };
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

// ── 레지스트리 ────────────────────────────────────────────────────────

export const SHAPE_REGISTRY: Record<ShapeId, ShapeDef> = {
  icosahedron: buildIcosahedron(),
  globe: buildGlobe(),
  finalsLogo: buildFinalsLogo(),
  hospitalCross: buildHospitalCross(),
};

/** "random" 테마에서 뽑는 풀 — 모든 도형이 후보다 (특정 곡 고정은 bgmThemes.ts에서만 한다) */
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

/** 도형을 회전시켜 화면 좌표의 선분 목록으로 투영한다. */
export function projectShape(
  def: ShapeDef,
  time: number,
  cx: number,
  cy: number,
  radius: number,
  rotation: RotationConfig,
): ProjectedShape {
  // upright 도형은 세워둔 채 수직축으로만 돌리고 살짝 끄덕이게 한다
  const rx = def.upright ? 0.2 * Math.sin(time * 0.4) : time * rotation.x + rotation.offset;
  const ry = def.upright
    ? time * rotation.y * 0.45 + rotation.offset
    : time * rotation.y + rotation.offset * 0.7;
  const rz = def.upright
    ? (def.tiltZ ?? 0.08 * Math.sin(time * 0.3))
    : time * rotation.z + rotation.offset * 1.3;

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
