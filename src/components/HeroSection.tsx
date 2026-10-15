"use client";

import SluBrand from "./SluBrand";

/**
 * 대기 화면의 회사 얼굴. 패널이 열리면 page.tsx가 비켜 준다.
 *
 * 마크와 회사명 둘뿐이다. 한 줄 정의·슬루컴패니 표기·대표 줄은 전부 뺐다 —
 * 같은 내용이 회사소개 탭에 이미 다 있어서 대기 화면에서 두 번 말할 이유가 없고,
 * 글이 길어질수록 배경 ASCII 도형을 덮는다. 여백이 이 화면의 내용이다.
 *
 * 워드마크를 SluBrand에 맡기지 않고 텍스트로 적는 건 그대로 유지한다.
 * SluBrand는 role="img" + aria-label 구조라 마크 안의 'SluCompany'는 색인되는
 * 본문이 아니고, 이 페이지의 h1은 실제 텍스트여야 한다.
 *
 * 상단 여백이 13vh에서 8vh로 줄었다. 줄을 세 개 덜어낸 만큼 블록이 짧아졌으니
 * 그대로 두면 도형과의 간격만 벌어지고 화면 위쪽이 비어 보인다.
 */
export default function HeroSection() {
  return (
    <section className="w-full px-6 pt-[8vh] sm:pt-[9vh]">
      <div className="flex flex-col items-center text-center">
        <SluBrand variant="mark" size={72} />
        <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-white">SluCompany</h1>
      </div>
    </section>
  );
}
