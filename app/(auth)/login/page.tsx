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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const nextPath = searchParams.get("next") ?? "/";

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const user = await authApi.loginPassword(data);
      setUser(user);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setSubmitError(toApiError(err).message);
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
    <div className="min-h-screen bg-[#281506]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* ── LEFT SIDE — Marketing ── */}
        <div className="relative flex w-1/2 flex-col justify-center px-12">
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

        {/* ── RIGHT SIDE — Form ── */}
        <div className="flex w-1/2 items-center justify-end px-8">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1e1e1c] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_-12px_rgba(0,0,0,0.5)]">
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

            {/* Google button */}
            <button className="text-foreground mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#2a2a28] px-4 py-3 text-sm font-medium hover:bg-[#333330]">
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
              Continue with Google
            </button>

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
                      <Checkbox className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white" />
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
                    className="w-full cursor-pointer rounded-lg bg-[#d4a373] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#c89564] disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="w-full cursor-pointer rounded-lg bg-[#d4a373] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#c89564] disabled:cursor-not-allowed disabled:opacity-60"
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
