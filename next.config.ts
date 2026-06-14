import type { NextConfig } from "next";

const RAW_API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "https://railmind.ddns.net";
const API_PROXY_TARGET = RAW_API_PROXY_TARGET.replace(/\/+$/, "").replace(
  /\/api(?:\/v\d+)?$/,
  ""
);

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${API_PROXY_TARGET}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
