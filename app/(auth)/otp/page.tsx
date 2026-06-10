"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Clock, ShieldCheck, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const email = searchParams.get("email") ?? "";
  const maskedEmail = email ? maskEmail(email) : "your email";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [resendTimer, setResendTimer] = useState(30);
  const [attempts, setAttempts] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Countdown timer (only runs after user clicks Verify) ──
  useEffect(() => {
    if (!submitted || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [submitted, timer]);

  // ── Resend cooldown (only runs after user clicks Verify) ──
  useEffect(() => {
    if (!submitted || resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [submitted, resendTimer]);

  // ── Format seconds to M:SS ──
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Handle OTP input ──
  const handleChange = (index: number, value: string) => {
    // Sirf numbers allow
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle backspace ──
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle paste (poora OTP ek saath) ──
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;

    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Submit ──
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6 || !email) return;
    setSubmitted(true);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const user = await authApi.verifyOtp({ email, code });
      setUser(user);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setSubmitError(toApiError(err).message);
      setAttempts((a) => Math.max(0, a - 1));
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Resend ──
  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    setSubmitError(null);
    try {
      await authApi.requestOtp({ email });
      setResendTimer(30);
      setTimer(600);
      setOtp(["", "", "", "", "", ""]);
      setSubmitted(true);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setSubmitError(toApiError(err).message);
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
              Step 2 of 2
            </span>

            {/* Heading */}
            <h1 className="text-foreground text-[48px] leading-[1.05] font-normal tracking-[-1px]">
              One last check, then
              <br />
              you&apos;re in
            </h1>

            {/* Subtext */}
            <p className="text-foreground/50 mt-4 max-w-md text-[17px]">
              We sent a 6-digit code to confirm it&apos;s really you. Codes
              expire in 10 minutes for your safety.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Mail className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Sent to your inbox
                  </p>
                  <p className="text-foreground/40 text-sm">
                    {maskedEmail} — check spam if missing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <ShieldCheck className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Two-factor protection
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Codes are single-use and tied to this device
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <RefreshCw className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Auto-resend
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Tap resend after the cooldown if it never arrives
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — OTP Form ── */}
        <div className="flex w-1/2 items-center justify-end px-8">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121713] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_-12px_rgba(0,0,0,0.5)]">
            {/* Mail icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a2a28]">
              <Mail className="text-accent-warm h-6 w-6" />
            </div>

            {/* Heading */}
            <h2 className="text-foreground text-2xl font-semibold">
              Check your email
            </h2>
            <p className="text-foreground/50 mt-2 text-sm">
              We sent a 6-digit code to{" "}
              <span className="text-foreground font-medium">{maskedEmail}</span>
            </p>

            {/* OTP Inputs */}
            <div
              className="mt-8 flex justify-center gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`text-foreground h-14 w-12 rounded-lg border text-center text-lg font-medium transition-colors outline-none ${
                    digit
                      ? "border-accent-warm bg-[#2a2318]"
                      : "border-white/10 bg-[#2a2a28]"
                  } focus:border-accent-warm`}
                />
              ))}
            </div>

            {/* Timer + Attempts */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="text-foreground/40 flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5" />
                Expires in {formatTime(timer)}
              </div>
              <p className="text-foreground/40 text-sm">
                {attempts}/3 attempts left
              </p>
            </div>

            {submitError && (
              <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {submitError}
              </p>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={submitted || isSubmitting}
              className="mt-6 w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:bg-[#2a2a28] disabled:text-white/40 disabled:hover:bg-[#2a2a28]"
            >
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting ? "Verifying…" : "Verify & continue"}
            </Button>

            {/* Resend */}
            <p className="text-foreground mt-4 text-sm font-medium">
              {resendTimer > 0 ? (
                <>Resend OTP in {formatTime(resendTimer)}</>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-accent-warm hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </p>

            {/* Change email */}
            <p className="text-foreground/40 mt-3 text-sm">
              Wrong email?{" "}
              <Link
                href="/register"
                className="text-accent-warm hover:underline"
              >
                Change it
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
