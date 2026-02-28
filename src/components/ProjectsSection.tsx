const projects = [
  {
    title: "CryptoHunter",
    description: "실시간 데이터 수집, GPT 전략 판단, 실제 자동 주문 실행까지 연동한 시스템. 로그 기록 및 리스크 관리 기능 포함. 결론부터 말하자면, 부자가 되진 못했다.",
  },
  {
    title: "안동장씨 남해 종친회",
    description: "남해의 안동 장씨 계보도를 재귀함수와 NONSQL-DB, 그리고 NodeJS 를 이용해 한눈에 볼 수 있도록 설계한 온라인 족보 프로그램. 족보를 트리 형태로 구현한 최초의 웹앱",
  },
  {
    title: "Auto Piano",
    description: "ArtMega Microprocessor 와 C언어를 이용해 만든 반응속도 높은 피아노. 컴퓨터와 연결하면 Putty 입력을 통해 키보드로 연주 가능.",
  },
  {
    title: "AI Localization PJ",
    description: "ollama 와 Deepseek 오픈소스, 그리고 RTX 4080 SUPER GPU로 Deepseek 8b/14b를 로컬로 구현.",
  },
  {
    title: "Trafficjam2",
    description: "객체 지향형 언어인 Java 로 자동차 객체를 섬세하게 구현하고 콘솔로 교통 체증이 발생하는 이유를 가시화한 실험적 시뮬레이터.",
  },
  {
    title: "애벌레노트",
    description: "Flutter 로 구현한 아이젠하워 매트릭스 기반의 메모/체크리스트 앱. 에버노트의 복잡함을 비판하며 설계. (부모님도 사용합니다)",
  },
  {
    title: "촉각전달기",
    description: "아두이노, 그리고 여러 개의 전선과... 모터들을 이용하여 그리드를 생성하여, 입력 단의 촉각을 사용자에게 비슷한 형태로 전달해줄 수 있었던 프로젝트. 당시에는 나름 혁신적이었다...",
  },
  {
    title: "KakaoTalt",
    description: "Flutter 로 구현한 코로나 카카오톡 백신패스 인증 우회 앱. 단순한 구조의 눈속임 앱이다.",
  },
  {
    title: "Supports",
    description: "운동 플랫폼 모바일 어플리케이션 써포츠의 프론트엔드를 일부 설계 및 제작했다. Firebase Auth를 사용한 소셜 로그인 구현부를 맡았다.",
  },
  {
    title: "L to L",
    description: "LLM to LLM 토론 시스템. Chat GPT 와 Gemini 둘이서 매일 다른 주제로 토론한다. 두 회사의 API 를 이용하였다. 흥미로운 토론 내용을 열람 가능하다.",
  },
  {
    title: "CarRentService",
    description: "랜트카 업장을 위한 간단한 프로젝트. 외국인들을 대상으로 서비스하도록 만든 플러터 기반의 웹 어플리케이션이다.",
  },
  {
    title: "SluWebGames",
    description: "Othello, Snake 와 같은 기본적인 게임들을 웹상에서 플러터로 구현했다. 서버리스이다. 특히 , 오델로는 칸별 Weights를 줘서 아주 작은 AI 를 구현했다.",
  },
  {
    title: "Project SSS",
    description: "Slu Sphere Server, 개인용 각종 유틸리티 서비스로, 해당 페이지 하단의 조회수 시스템 같이 기초적인 툴들을 제공한다. MongoDB + Nodejs 로 제작.",
  },
  {
    title: "PP",
    description: "Project Portfolio. 지금 보고 계신 플러터 기반의 정적 웹 서비스 입니다 ^^",
  },
];

export default function ProjectsSection() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {projects.map((project) => (
          <div key={project.title} className="bg-gray-900 rounded p-3">
            <h3 className="font-bold text-base text-white">{project.title}</h3>
            <p className="mt-2 text-sm text-gray-300 overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical'}}>
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
