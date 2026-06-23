import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trendlinks 清掃現場管理",
    short_name: "Trendlinks",
    description: "清掃現場管理SaaS",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#059669",
    lang: "ja",
  };
}
