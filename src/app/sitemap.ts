import type { MetadataRoute } from "next";
import { siteOrigin } from "@/shared/site";

const routes = [
  { path: "/operations", changeFrequency: "hourly", priority: 1 },
  { path: "/assets", changeFrequency: "hourly", priority: 0.8 },
  { path: "/incidents", changeFrequency: "hourly", priority: 0.8 },
  { path: "/alerts", changeFrequency: "hourly", priority: 0.8 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
