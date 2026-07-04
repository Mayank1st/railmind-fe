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

// Allow Supabase Storage public URLs to be served through next/image.
// Hostname is derived from the project URL so it stays correct across envs.
function supabaseImageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}
const SUPABASE_HOST = supabaseImageHost();

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: SUPABASE_HOST
      ? [
          {
            protocol: "https",
            hostname: SUPABASE_HOST,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
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
