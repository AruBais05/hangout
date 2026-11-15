import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Dev server only: let phones on the same Wi-Fi load the app (http://<wifi-ip>:3000).
  // Has no effect on the deployed Vercel site.
  allowedDevOrigins: ["172.20.10.4", "192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // The AI routes read their system prompts from ./prompts at runtime.
  outputFileTracingIncludes: {
    "/api/suggest": ["./prompts/**/*"],
    "/api/quiz": ["./prompts/**/*"],
  },
};

export default nextConfig;
