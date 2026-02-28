"use client";

import { useEffect, useState, useRef } from "react";

const colors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

interface BubbleData {
  id: number;
  size: number;
  initialX: number;
  initialY: number;
  color: string;
  speed: number;
  amplitude: number;
  offset: number;
}

function Bubble({ data, mousePos }: { data: BubbleData; mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const elementRef = useRef<HTMLDivElement>(null);
  // 현재 회피 위치 상태 저장 (부드러운 움직임을 위해)
  const state = useRef({
    avoidX: 0,
    avoidY: 0,
  });

  useEffect(() => {
    let animationFrameId: number;
    const startTime = Date.now();

    const update = () => {
      if (!elementRef.current) return;

      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // 초 단위 경과 시간

      // 1. 기본 둥둥 떠다니는 움직임 (Sine/Cosine 파동)
      // X와 Y의 속도를 다르게 하여 불규칙한 궤적 생성
      // 두 개의 파동을 합성하여 단순 반복(초기화)되는 느낌을 없애고 궤적을 길게 만듦
      const ambientX = Math.sin(elapsed * data.speed + data.offset) * data.amplitude +
                       Math.sin(elapsed * data.speed * 0.37 + data.offset) * (data.amplitude * 0.5);
                       
      const ambientY = Math.cos(elapsed * data.speed * 0.8 + data.offset) * data.amplitude +
                       Math.cos(elapsed * data.speed * 0.31 + data.offset) * (data.amplitude * 0.5);

      // 2. 마우스/터치 회피 로직
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      
      // 버블의 기본 위치 (화면 비율 기준)
      const baseX = (data.initialX / 100) * winW;
      const baseY = (data.initialY / 100) * winH;
      
      // 현재 버블의 추정 중심 좌표 (기본 위치 + 둥둥거림 + 이전 회피값)
      const currentX = baseX + ambientX + state.current.avoidX + data.size / 2;
      const currentY = baseY + ambientY + state.current.avoidY + data.size / 2;

      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      // 마우스와 버블 사이의 거리 계산
      const dx = currentX - mx;
      const dy = currentY - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const repulsionRadius = 500; // 반응 반경 (이 거리 안에 들어오면 도망감)
      const maxRepulsion = 1000; // 최대 도망 거리

      let targetAvoidX = 0;
      let targetAvoidY = 0;

      // 반응 반경 안에 들어왔을 때
      if (dist < repulsionRadius) {
        const force = (repulsionRadius - dist) / repulsionRadius; // 0.0 ~ 1.0 (가까울수록 1)
        const angle = Math.atan2(dy, dx); // 도망갈 방향
        const push = force * maxRepulsion; // 밀어내는 힘
        
        targetAvoidX = Math.cos(angle) * push;
        targetAvoidY = Math.sin(angle) * push;
      }

      // 부드러운 움직임을 위한 선형 보간 (Lerp)
      // 목표 위치로 서서히 이동 (0.08은 반응 속도 계수)
      const lerpFactor = 0.1;
      state.current.avoidX += (targetAvoidX - state.current.avoidX) * lerpFactor;
      state.current.avoidY += (targetAvoidY - state.current.avoidY) * lerpFactor;

      // 최종 위치 적용
      const finalX = ambientX + state.current.avoidX;
      const finalY = ambientY + state.current.avoidY;

      elementRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [data, mousePos]);

  return (
    <div
      ref={elementRef}
      className="absolute rounded-full opacity-40 blur-3xl"
      style={{
        width: data.size,
        height: data.size,
        backgroundColor: data.color,
        left: `${data.initialX}%`,
        top: `${data.initialY}%`,
        willChange: "transform", // 성능 최적화
      }}
    />
  );
}

export default function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  // 마우스 위치를 ref로 관리하여 리렌더링 없이 값 공유
  const mousePos = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // 버블 초기화
    // 클라이언트 사이드에서만 랜덤 값 생성 (Hydration mismatch 방지)
    const newBubbles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 150 + 50,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 1.5 + 0.5, // 둥둥거리는 속도 (더 빠르게)
      amplitude: Math.random() * 300 + 100, // 둥둥거리는 범위
      offset: Math.random() * Math.PI * 2, // 시작 위상 랜덤화
    }));
    setBubbles(newBubbles);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <Bubble key={bubble.id} data={bubble} mousePos={mousePos} />
      ))}
    </div>
  );
}