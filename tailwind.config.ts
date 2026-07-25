import type { Config } from "tailwindcss";

const config: Config = {
  // src 아래 전부를 스캔한다. 예전엔 존재하지도 않는 src/pages를 넣고 src/lib·hooks·i18n을
  // 빼 놨는데, 마침 그쪽에 클래스가 없어 손실이 0이었을 뿐 새 디렉터리를 만드는 순간
  // 조용히 스타일이 빠지는 함정이었다.
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
