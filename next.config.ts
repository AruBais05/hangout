import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The AI routes read their system prompts from ./prompts at runtime.
  outputFileTracingIncludes: {
    "/api/suggest": ["./prompts/**/*"],
    "/api/quiz": ["./prompts/**/*"],
  },
};

export default nextConfig;
