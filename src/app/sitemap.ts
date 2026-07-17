import type { MetadataRoute } from "next";

// https://slupark.com/sitemap.xml 로 서빙된다 — Search Console에 이 주소를 제출한다
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://slupark.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
