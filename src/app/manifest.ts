import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RatboD - Health Analysis & Tracking",
    short_name: "RatboD",
    description: "Your personal body health analysis and tracking partner.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F0F",
    theme_color: "#32CD32",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
