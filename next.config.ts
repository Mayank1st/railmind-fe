import type { NextConfig } from "next";

const RAW_API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "https://railmind.ddns.net";

function toOrigin(raw: string): string {
  const t = raw.trim();
  try {
    return new URL(t).origin;
  } catch {
    return t.replace(/\/+$/, "").replace(/(\/api(\/v\d+)?)+$/, "");
  }
}
const API_PROXY_TARGET = toOrigin(RAW_API_PROXY_TARGET);

console.log(
  `[next.config] API proxy target: ${JSON.stringify(RAW_API_PROXY_TARGET)} → ${API_PROXY_TARGET}`
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
