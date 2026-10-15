/**
 * 왼쪽 정렬 본문 사이의 구획선.
 *
 * 서비스·회사소개의 헤어라인은 가운데 정렬 맥락이라 양끝이 녹는다. 대표 탭처럼
 * 읽는 칸이 왼쪽 정렬일 때는 선도 글이 시작하는 자리에서 진하게 시작해 오른쪽으로
 * 녹아야 칸의 왼쪽 모서리가 하나로 선다. 같은 집안, 다른 방향이다.
 */
export default function Hairline({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-px w-full bg-gradient-to-r from-gray-700 via-gray-700/50 to-transparent ${className}`}
    />
  );
}
