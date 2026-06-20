"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { authApi } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ── Password Login Schema ──
const passwordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── OTP Login Schema ──
const otpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Highlight the Google button when a Google-only user tries password login.
  const [highlightGoogle, setHighlightGoogle] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const nextPath = searchParams.get("next") ?? "/";

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setSubmitError(null);
    setHighlightGoogle(false);
    setIsSubmitting(true);
    try {
      const user = await authApi.loginPassword({
        ...data,
        remember_me: rememberMe,
      });
      setUser(user);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      const apiError = toApiError(err);
      // RM-AUTH-018: this is a Google-only account — nudge them to the Google
      // button instead of the password form.
      if (apiError.code === "RM-AUTH-018") {
        setHighlightGoogle(true);
        setSubmitError(
          "This account uses Google sign-in. Please continue with Google."
        );
      } else {
        setSubmitError(apiError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await authApi.requestOtp(data);
      router.push(`/otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setSubmitError(toApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a18] lg:bg-[#281506]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* ── LEFT SIDE — Marketing (desktop only) ── */}
        <div className="relative hidden w-1/2 flex-col justify-center px-12 lg:flex">
          <div className="relative z-10">
            {/* Badge */}
            <span className="border-accent-warm/30 text-accent-warm mb-6 inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Welcome back
            </span>

            {/* Heading */}
            <h1 className="text-foreground text-[48px] leading-[1.05] font-normal tracking-[-1px]">
              Sign in to keep
              <br />
              travelling smarter
            </h1>

            {/* Subtext */}
            <p className="text-foreground/50 mt-4 max-w-md text-[17px]">
              Pick up where you left off. Saved passengers, recurring routes,
              and AI predictions waiting for you.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Bookmark className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Resume bookings
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Carts and held seats stay yours for 10 minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Sparkles className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Personalised insights
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Tatkal alerts and confirm probability for your routes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <ShieldCheck className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Trusted access
                  </p>
                  <p className="text-foreground/40 text-sm">
                    OTP fallback, device alerts, and active-session control
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — Form (full-width, borderless on mobile) ── */}
        <div className="flex w-full items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:justify-end lg:py-0">
          <div className="w-full max-w-md sm:rounded-2xl sm:border sm:border-white/15 sm:bg-[#121713] sm:p-8 sm:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_-12px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <h2 className="text-foreground text-2xl font-semibold">
              Welcome back
            </h2>
            <p className="text-foreground/50 mt-1 text-sm">
              New to RailMind?{" "}
              <Link
                href="/register"
                className="text-accent-warm hover:underline"
              >
                Create an account
              </Link>
            </p>

            {/* Google sign-in (GIS official button, themed dark) */}
            <GoogleSignInButton
              next={nextPath}
              onError={setSubmitError}
              highlight={highlightGoogle}
              rememberMe={rememberMe}
            />

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs tracking-wider text-white/30 uppercase">
                or sign in with
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Toggle — Password / OTP */}
            <div className="mb-6 flex rounded-lg bg-[#2a2a28] p-1">
              <button
                type="button"
                onClick={() => setLoginMode("password")}
                className={`flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  loginMode === "password"
                    ? "text-foreground bg-[#3a3a38]"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("otp")}
                className={`flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  loginMode === "otp"
                    ? "text-foreground bg-[#3a3a38]"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                OTP
              </button>
            </div>

            {/* Forms — both stacked in same grid cell so they cross-fade */}
            <div className="grid">
              {/* ── Password Form ── */}
              <div
                aria-hidden={loginMode !== "password"}
                className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                  loginMode === "password"
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none -translate-x-2 opacity-0"
                }`}
              >
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                      Email or Mobile
                    </label>
                    <input
                      {...passwordForm.register("email")}
                      placeholder="ananya.s@example.com"
                      className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                    />
                    {passwordForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-400">
                        {passwordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...passwordForm.register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 pr-10 text-sm outline-none placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-red-400">
                        {passwordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember me + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="text-foreground/50 flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked === true)
                        }
                        className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white"
                      />
                      Remember me
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-accent-warm text-sm hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {submitError && (
                    <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {submitError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </div>

              {/* ── OTP Form ── */}
              <div
                aria-hidden={loginMode !== "otp"}
                className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                  loginMode === "otp"
                    ? "translate-x-0 opacity-100"
                    : "pointer-events-none translate-x-2 opacity-0"
                }`}
              >
                <form
                  onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                      Email or Mobile
                    </label>
                    <input
                      {...otpForm.register("email")}
                      placeholder="ananya.s@example.com"
                      className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                    />
                    {otpForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-400">
                        {otpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {submitError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending…" : "Send OTP"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
