"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { authApi, type GoogleAuthResult } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

// GIS only issues the ID-token `credential` via its OWN rendered button (or One
// Tap) — a fully custom button cannot trigger this flow. To keep our custom
// dark button (design's choice), we use Option B from the integration guide:
// render Google's real button at opacity:0 sized exactly over our visual button,
// so the user sees ours but actually clicks Google's.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Map known backend auth error codes to user-facing copy (see error table). */
function googleErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "RM-AUTH-017":
      // Token invalid/expired/audience mismatch — short-lived, just retry.
      return "Google sign-in failed. Please try again.";
    case "RM-AUTH-019":
      return "Please verify your email with Google first.";
    default:
      return fallback ?? "Google sign-in failed. Please try again.";
  }
}

/** Our custom Google mark — kept identical to the original login/register button. */
function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  /** Where to send returning users whose profile is already complete. */
  next?: string;
  /** Bubble errors up to the host page's existing error UI. */
  onError?: (message: string) => void;
  /** Draw attention to the button (e.g. after a RM-AUTH-018 password error). */
  highlight?: boolean;
};

export function GoogleSignInButton({
  next = "/",
  onError,
  highlight = false,
}: GoogleSignInButtonProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  // The GIS script may already be present (cached) when we mount — e.g. when
  // navigating between /login and /register — in which case onReady/onLoad
  // won't fire. Seed the state from that case; the Script callbacks cover the
  // first (uncached) load.
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.google?.accounts?.id)
  );
  const [loading, setLoading] = useState(false);

  // Keep latest props in refs so we don't re-initialise GIS on every change.
  const nextRef = useRef(next);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    nextRef.current = next;
    onErrorRef.current = onError;
  });

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      const credential = response?.credential;
      if (!credential) {
        onErrorRef.current?.("Google sign-in failed. Please try again.");
        return;
      }

      setLoading(true);
      try {
        const result: GoogleAuthResult = await authApi.google(credential);

        // The session cookies are now set. Pull the canonical profile so we can
        // (a) seed the auth store and (b) route off REAL profile completeness,
        // not just `is_new_user` — this also catches returning users who
        // signed up earlier but abandoned onboarding.
        let me: Awaited<ReturnType<typeof authApi.me>> = null;
        try {
          me = await authApi.me();
          setUser(me);
        } catch {
          setUser(null);
        }

        const incomplete =
          !me || !me.gender || !me.marital_status || !me.first_name;

        if (result.is_new_user || incomplete) {
          const params = new URLSearchParams();
          const fn = result.suggested_first_name ?? me?.first_name ?? "";
          const ln = result.suggested_last_name ?? me?.last_name ?? "";
          if (fn) params.set("fn", fn);
          if (ln) params.set("ln", ln);
          if (nextRef.current && nextRef.current !== "/") {
            params.set("next", nextRef.current);
          }
          const qs = params.toString();
          router.replace(`/complete-profile${qs ? `?${qs}` : ""}`);
        } else {
          router.replace(nextRef.current);
        }
        router.refresh();
      } catch (err) {
        const { code, message } = toApiError(err);
        onErrorRef.current?.(googleErrorMessage(code, message));
      } finally {
        setLoading(false);
      }
    },
    [router, setUser]
  );

  // Initialise GIS and render the (invisible) official button into the overlay,
  // sized to match our visual button so the whole surface is clickable.
  useEffect(() => {
    if (!scriptReady || !CLIENT_ID) return;
    const google = window.google;
    const el = overlayRef.current;
    if (!google?.accounts?.id || !el) return;

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
    });

    let lastWidth = 0;
    const renderButton = () => {
      if (!el) return;
      // GIS takes a fixed pixel width; clamp to its supported range and match
      // our button so there are no un-clickable dead zones.
      const width = Math.min(400, Math.max(240, Math.round(el.clientWidth)));
      if (width === lastWidth) return;
      lastWidth = width;
      el.innerHTML = "";
      google.accounts.id.renderButton(el, {
        theme: "filled_black",
        size: "large",
        type: "standard",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
      });
    };

    renderButton();
    const ro = new ResizeObserver(() => renderButton());
    ro.observe(el);
    return () => ro.disconnect();
  }, [scriptReady, handleCredential]);

  // Misconfiguration guard: keep the same custom button, but clearly disabled,
  // if the Client ID env var is missing.
  if (!CLIENT_ID) {
    return (
      <div
        className="text-foreground/40 mt-6 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#2a2a28]/60 px-4 py-3 text-sm font-medium"
        title="Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing)."
      >
        <GoogleLogo />
        Continue with Google
      </div>
    );
  }

  return (
    <>
      <Script
        src={GSI_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div
        className={cn(
          "group relative mt-6 rounded-lg",
          highlight &&
            "ring-2 ring-[#E8AA4D] ring-offset-2 ring-offset-[#121713]"
        )}
      >
        {/* ── Our custom button (purely visual; the GIS overlay handles clicks) ── */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="text-foreground flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#2a2a28] px-4 py-3 text-sm font-medium transition-colors group-hover:bg-[#333330]"
        >
          <GoogleLogo />
          Continue with Google
        </button>

        {/* ── Invisible GIS button overlaid on top (the real click target) ── */}
        <div
          ref={overlayRef}
          aria-label="Continue with Google"
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center overflow-hidden [color-scheme:dark] opacity-0"
        />

        {/* Busy overlay while we exchange the token + load the profile. */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[#121713]/70 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#E8AA4D]" />
          </div>
        )}
      </div>
    </>
  );
}
