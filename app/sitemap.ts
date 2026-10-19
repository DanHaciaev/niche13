import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
