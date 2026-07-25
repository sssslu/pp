/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        // 갤러리가 쓰는 imgur URL은 전부 /<id>.png 또는 /<id>.jpeg 한 단계다(사용처 50개 전수 확인).
        // '/**'로 열어 두면 /_next/image가 imgur의 아무 경로든 대신 받아 오는 통로가 된다.
        // 새 확장자를 쓰게 되면 여기 목록에 추가해야 한다.
        pathname: '/*.{png,jpeg}',
      },
    ],
  },
  // 서버가 응답할 때만 붙는다 — output:'export'로 되돌리면 빌드 경고와 함께 무시된다.
  // CSP는 일부러 넣지 않았다: App Router가 부트스트랩 스크립트를 인라인해서 nonce가
  // 필요한데 nonce는 middleware를 요구하고, 지금 middleware가 없다는 사실 자체가
  // next 14.2.x의 critical 권고(미들웨어 인가 우회)를 무력화하고 있기 때문이다.
  // 'unsafe-inline'을 넣은 CSP는 보안 가치가 사실상 없어 노이즈만 남는다.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // MIME 스니핑 차단. 이 사이트가 내보내는 타입은 전부 정확하다.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // 외부로 나갈 때 경로를 넘기지 않는다 (사이트 내 이동은 그대로)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 이 사이트를 iframe에 담을 이유가 없다 (클릭재킹 차단)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // 쓰지 않는 권한은 잠근다 — 서드파티 스크립트가 없어 부작용도 없다
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
