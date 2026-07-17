import type { MetadataRoute } from "next";

// https://slupark.com/robots.txt 로 서빙된다
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://slupark.com/sitemap.xml",
  };
}
