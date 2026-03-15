import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/success",
          "/device",
          "/(auth)/",
        ],
      },
    ],
    sitemap: "https://memorycrystal.ai/sitemap.xml",
  };
}
