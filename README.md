# slupark.com

박슬우(Slu Park)의 개인 포트폴리오. 한 페이지 안에서 하단 도크로 섹션을 넘기는
Next.js App Router 앱이다.

## Stack

- Next.js 14.2 (App Router) / React 18
- TypeScript (strict)
- Tailwind CSS 3.4
- framer-motion 12

빌드하면 `/`, `robots.txt`, `sitemap.xml`이 정적으로 미리 만들어진다.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run start
npm run lint
```

## 구조

```
src/app/               라우트 (page.tsx 하나 + layout / robots.ts / sitemap.ts)
src/components/        섹션 컴포넌트 (Hero / About / Perk / Projects / Hobby / Gallery ...)
src/hooks/             useBgmPlayer — BGM 재생·페이드·볼륨
src/i18n/              한국어·영어 번역 (locales/ko.ts, locales/en.ts)
src/lib/ascii/         배경 캔버스 엔진 (shapes / gargantua / events)
src/lib/bgmTracks.ts   곡별 설정의 단일 진입점
public/bgm/            BGM 파일
```

## 눈여겨볼 곳 세 군데

### 1. 아스키 배경 캔버스 — `src/components/AsciiBackground.tsx`

배경 전체가 아스키 글자로 그려지는데, 글자를 매 프레임 `fillText`로 찍지 않는다.
64×64칸짜리 타일 캔버스에 글자를 미리 구워 `CanvasPattern`으로 만들고,
배경은 `fillRect` 한 번, 중앙 도형과 클릭 리플은 그 패턴으로 스트로크한다.
깜빡임은 타일 변형 여러 장과 격자 단위 오프셋 교체로 흉내낸다.
색이 바뀌면 그 색의 타일을 새로 굽기 때문에, 더 이상 쓰지 않는 색의 타일은
전환이 끝난 뒤 비운다.

### 2. 곡별 시각 테마 — `src/lib/bgmTracks.ts`

재생 중인 곡이 화면의 색과 중앙 도형을 결정한다. 배경색·도형색·리플색·도형·
볼륨 정규화 배율이 곡마다 한 줄에 모여 있고, 곡이 바뀌면 커스텀 이벤트
(`src/lib/ascii/events.ts`)로 캔버스에 방송된다. 도형은 와이어프레임(`shapes.ts`)
이거나 캔버스를 통째로 그리는 전용 장면인데, 7번 곡에는 후자인 블랙홀
(`gargantua.ts`)이 붙어 있다.

볼륨은 곡마다 ffmpeg `loudnorm`으로 통합 라우드니스를 재서 -14 LUFS 기준
배율을 넣어 둔다.

```
gain = 10^((-14 - input_i) / 20)
```

### 3. 8비트 이징 — `src/components/PerkSection.tsx`

스택 목록이 블랙홀로 빨려 들어가는 연출에서 보간을 부드럽게 하지 않는다.
진행도를 n단계로 양자화해 픽셀이 점프하듯 움직인다.

```ts
const quantize = (n: number) => (p: number) => (p >= 1 ? 1 : Math.floor(p * n) / n);
```

이 연출의 애니메이션은 전부 유한해서, 끝나고 나면 정적 요소만 남아 프레임 비용이
0이 된다.
