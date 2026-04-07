import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.base44.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "base44.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
