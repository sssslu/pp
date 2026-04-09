export interface EduLine1 { before: string; between: string; after: string }
export interface EduLine2 { before: string; between: string; after: string }
export interface EduLine3 { before: string; after: string }
export interface EduLine4 { before: string; after: string }
export interface EduLine5 { before: string; between: string; after: string }

export interface ExpLine1 { before: string; mid1: string; mid2: string; after: string }
export interface ExpLine3 { before: string; mid1: string; mid2: string; mid3: string; after: string }
export interface ExpLine4 { before: string; mid: string; after: string }
export interface ExpLine5 { before: string; mid1: string; mid2: string; after: string }
export interface ExpLine6 { before: string; after: string }

export interface Translations {
  tabs: readonly [string, string, string, string, string];
  hero: { title: string; subtitle: string };
  about: {
    educationTitle: string;
    experienceTitle: string;
    edu: {
      line1: EduLine1;
      line2: EduLine2;
      line3: EduLine3;
      line4: EduLine4;
      line5: EduLine5;
    };
    exp: {
      line1: ExpLine1;
      line2: string;
      line3: ExpLine3;
      line4: ExpLine4;
      line5: ExpLine5;
      line6: ExpLine6;
    };
  };
  perk: {
    strengthsTitle: string;
    strengths: readonly string[];
    stackTitle: string;
  };
  projects: {
    descriptions: Record<string, string>;
  };
  hobby: {
    freedivingTitle: string;
    freedivingContent: string;
    artTitle: string;
    artContent: string;
  };
  contact: {
    title: string;
    copiedPrefix: string;
  };
}

export const ko: Translations = {
  tabs: ["소개", "능력치!", "프로젝트", "취미", "갤러리"],

  hero: {
    title: "Profile : 박 슬우",
    subtitle: "주의 : 이 사람은 심심합니다",
  },

  about: {
    educationTitle: "학력과 경력",
    experienceTitle: "경험",
    edu: {
      line1: { before: "- ", between: " 졸업 / ", after: " 활동 및 다회 수상" },
      line2: { before: "- ", between: " ", after: " 졸업" },
      line3: { before: "- ", after: " 만기 전역" },
      line4: { before: "- ", after: " 연구원" },
      line5: { before: "- ", between: " 에서 ", after: "으로 근무" },
    },
    exp: {
      line1: { before: "- ", mid1: ", 자동화 시스템을 활용해 ", mid2: "을 구현하고 운영한 경험이 있습니다. ", after: "" },
      line2: "- iOS 및 Android용 모바일 앱을 설계하고 배포한 경험이 있습니다.",
      line3: { before: "- ", mid1: " 사서 프로그램 ", mid2: " 와 ", mid3: " 고속 스캔 프로그램 ", after: " 를 유지보수한 경험이 있습니다." },
      line4: { before: "- ", mid: "에서 여러가지 ", after: "에서 활동한 경험이 있습니다." },
      line5: { before: "- ", mid1: "에서 ", mid2: "을 받고 ", after: "를 수행한 경험이 있습니다." },
      line6: { before: "- ", after: "로 활동한 경험이 있습니다!" },
    },
  },

  perk: {
    strengthsTitle: "강점",
    strengths: ["창의성", "책임감", "능통한 영어 / 한국어"],
    stackTitle: "스택",
  },

  projects: {
    descriptions: {
      "CryptoHunter":
        "실시간 데이터 수집, GPT 전략 판단, 실제 자동 주문 실행까지 연동한 시스템. 로그 기록 및 리스크 관리 기능 포함. 결론부터 말하자면, 부자가 되진 못했다.",
      "안동장씨 남해 종친회":
        "남해의 안동 장씨 계보도를 재귀함수와 NONSQL-DB, 그리고 NodeJS 를 이용해 한눈에 볼 수 있도록 설계한 온라인 족보 프로그램. 족보를 트리 형태로 구현한 최초의 웹앱",
      "Auto Piano":
        "ArtMega Microprocessor 와 C언어를 이용해 만든 반응속도 높은 피아노. 컴퓨터와 연결하면 Putty 입력을 통해 키보드로 연주 가능.",
      "AI Localization PJ":
        "ollama 와 Deepseek 오픈소스, 그리고 RTX 4080 SUPER GPU로 Deepseek 8b/14b를 로컬로 구현.",
      "Trafficjam2":
        "객체 지향형 언어인 Java 로 자동차 객체를 섬세하게 구현하고 콘솔로 교통 체증이 발생하는 이유를 가시화한 실험적 시뮬레이터.",
      "애벌레노트":
        "Flutter 로 구현한 아이젠하워 매트릭스 기반의 메모/체크리스트 앱. 에버노트의 복잡함을 비판하며 설계. (부모님도 사용합니다)",
      "촉각전달기":
        "아두이노, 그리고 여러 개의 전선과... 모터들을 이용하여 그리드를 생성하여, 입력 단의 촉각을 사용자에게 비슷한 형태로 전달해줄 수 있었던 프로젝트. 당시에는 나름 혁신적이었다...",
      "KakaoTalt":
        "Flutter 로 구현한 코로나 카카오톡 백신패스 인증 우회 앱. 단순한 구조의 눈속임 앱이다.",
      "Supports":
        "운동 플랫폼 모바일 어플리케이션 써포츠의 프론트엔드를 일부 설계 및 제작했다. Firebase Auth를 사용한 소셜 로그인 구현부를 맡았다.",
      "L to L":
        "LLM to LLM 토론 시스템. Chat GPT 와 Gemini 둘이서 매일 다른 주제로 토론한다. 두 회사의 API 를 이용하였다. 흥미로운 토론 내용을 열람 가능하다.",
      "CarRentService":
        "랜트카 업장을 위한 간단한 프로젝트. 외국인들을 대상으로 서비스하도록 만든 플러터 기반의 웹 어플리케이션이다.",
      "Project SSS":
        "Slu Sphere Server, 개인용 각종 유틸리티 서비스로, 해당 페이지 하단의 조회수 시스템 같이 기초적인 툴들을 제공한다. MongoDB + Nodejs 로 제작.",
      "PP": "Project Portfolio. 지금 보고 계신 플러터 기반의 정적 웹 서비스 입니다 ^^ - 20260301수정 : 이젠 아닙니다.",
    },
  },

  hobby: {
    freedivingTitle: "프리다이빙 (강사 및 국제 심판 자격 보유)",
    freedivingContent: `2022년 경 자신의 한계에 도전하는 스포츠, 프리다이빙에 입문하게 되어,

- SNSI Indoor Freediver
- Freediver
- Advanced Freediver
- Deep Freediver

를 순차적으로 취득.

이후
- Freediver Instructor
- Advanced Freediver Instructor
강사 자격을 취득하였으며,

프리다이빙 센터 Onedive 의 소속 강사로 활동하며
100명 이상의 한국인 및 외국인 수강생에게 자격을 부여함.

- BLSD First Aid, EFR Life Savior 등 인명 구조 관련 자격 보유.
- CMAS 국제핀수영협회 심판관 자격(JUDGE 3급)
- 2026 KUA 국가대표선발전 수중심판으로 활동하였음.`,
    artTitle: "그림 및 아트웍, 디자인",
    artContent: "예술적인 감각이 있습니다!! (본인 주장, 경력 없음, 갤러리 참조)",
  },

  contact: {
    title: "Contact",
    copiedPrefix: "Contact Copied! : ",
  },
};
