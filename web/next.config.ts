import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [{ source: "/redesign", destination: "/en/redesign", permanent: false }];
  },
};

export default nextConfig;
