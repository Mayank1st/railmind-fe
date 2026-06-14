import type { NextConfig } from "next";

const RAW_API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "https://railmind.ddns.net";

// Reduce the proxy target to its bare ORIGIN (scheme://host[:port]). The rewrites
// below append the full `/api/...` path, so ANY path left on the target — e.g. a
// stray `/api/v1` (or even a doubled `/api/v1/api/v1`) in the env — would double
// the prefix and 404 every request. `new URL().origin` strips path/query/trailing
// slash bulletproof-ly; the regex is a fallback for a scheme-less value.
function toOrigin(raw: string): string {
  const t = raw.trim();
  try {
    return new URL(t).origin;
  } catch {
    return t.replace(/\/+$/, "").replace(/(\/api(\/v\d+)?)+$/, "");
  }
}
const API_PROXY_TARGET = toOrigin(RAW_API_PROXY_TARGET);

// Printed during `next build` → visible in the Vercel build log, so a
// misconfigured env (and what it normalized to) is obvious at a glance.
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
