"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsappIcon } from "@/components/auth/WhatsappIcon";
import { WhatsappSandboxHelper } from "@/components/auth/WhatsappSandboxHelper";
import { authApi, type User } from "@/lib/auth";
import { toApiError } from "@/lib/api";

const mobileSchema = z.object({
  mobile_number: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});

type MobileFormData = z.infer<typeof mobileSchema>;

// Must match the backend's OTP validity window — it drives the resend
// cooldown after a successful send, and RM-AUTH-011 re-syncs it if they drift.
const OTP_TTL_SECONDS = 300;

function parseWaitSeconds(message: string) {
  const match = message.match(/(\d+)\s*seconds?/i);
  return match ? Number(match[1]) : OTP_TTL_SECONDS;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface WhatsappOtpFormProps {
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  onSuccess: (user: User) => void;
}

export function WhatsappOtpForm({
  rememberMe,
  onRememberMeChange,
  onSuccess,
}: WhatsappOtpFormProps) {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  // The number the OTP was actually sent to — the form field may change after.
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  // 3 wrong tries burn the OTP (RM-AUTH-013) — only a fresh OTP helps.
  const [otpBurned, setOtpBurned] = useState(false);
  // WhatsApp delivery failed (RM-AUTH-012) — almost always means the number
  // hasn't joined the Twilio sandbox, so auto-open the setup helper.
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mobileForm = useForm<MobileFormData>({
    resolver: zodResolver(mobileSchema),
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const sendOtp = async (mobile: string) => {
    setError(null);
    setNotRegistered(false);
    setDeliveryFailed(false);
    setIsSubmitting(true);
    try {
      await authApi.sendWhatsappOtp({ mobile_number: mobile });
      setMobileNumber(mobile);
      setOtp("");
      setOtpBurned(false);
      setCooldown(OTP_TTL_SECONDS);
      setStep("otp");
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "RM-AUTH-004") {
        setNotRegistered(true);
        setError("This mobile number isn't registered with RailMind.");
      } else if (apiError.code === "RM-AUTH-011") {
        // An OTP is already live for this number — go to the entry step with
        // the backend-reported wait as the resend cooldown.
        setMobileNumber(mobile);
        setOtpBurned(false);
        setCooldown(parseWaitSeconds(apiError.message));
        setStep("otp");
      } else {
        // RM-AUTH-012 (delivery failed), RM-RATE-001, validation — message is
        // user-facing; the send button stays available for retry.
        setError(apiError.message);
        if (apiError.code === "RM-AUTH-012") {
          setDeliveryFailed(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMobileSubmit = (data: MobileFormData) => sendOtp(data.mobile_number);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authApi.verifyWhatsappOtp({
        mobile_number: mobileNumber,
        otp,
        remember_me: rememberMe,
      });
      onSuccess(user);
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "RM-AUTH-013") {
        setOtpBurned(true);
        setError("Too many wrong attempts. Request a new OTP to continue.");
      } else if (apiError.code === "RM-AUTH-014") {
        setStep("mobile");
        setOtp("");
        setError("OTP expired. Request a new one.");
      } else if (apiError.code === "RM-AUTH-004") {
        setStep("mobile");
        setOtp("");
        setError(apiError.message);
      } else {
        // RM-AUTH-015 (wrong OTP, N attempts left), RM-AUTH-020 (email not
        // verified), RM-AUTH-021 (account disabled), RM-RATE-001 — backend
        // messages are already user-facing.
        setError(apiError.message);
        if (
          apiError.code === "RM-AUTH-015" &&
          /\b0 attempts/i.test(apiError.message)
        ) {
          setOtpBurned(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedMobile = `${mobileNumber.slice(0, 2)}••••••${mobileNumber.slice(-2)}`;

  if (step === "mobile") {
    return (
      <form
        key="mobile-step"
        onSubmit={mobileForm.handleSubmit(onMobileSubmit)}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
            Mobile Number
          </label>
          <input
            {...mobileForm.register("mobile_number")}
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
          />
          {mobileForm.formState.errors.mobile_number && (
            <p className="mt-1 text-xs text-red-400">
              {mobileForm.formState.errors.mobile_number.message}
            </p>
          )}
          <p className="text-foreground/40 mt-1.5 text-xs">
            We&apos;ll send a 6-digit code to your WhatsApp
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
            {notRegistered && (
              <>
                {" "}
                <Link
                  href="/register"
                  className="text-accent-warm hover:underline"
                >
                  Create an account
                </Link>
              </>
            )}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <WhatsappIcon className="mr-2 h-4 w-4" />
          {isSubmitting ? "Sending…" : "Send OTP on WhatsApp"}
        </Button>

        {deliveryFailed && <WhatsappSandboxHelper defaultOpen />}
      </form>
    );
  }

  return (
    <form key="otp-step" onSubmit={handleVerify} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
          WhatsApp OTP
        </label>
        <input
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={otpBurned}
          placeholder="••••••"
          className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-center text-lg tracking-[0.5em] outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-foreground/40 mt-1.5 text-xs">
          Sent on WhatsApp to {maskedMobile} · valid for 5 minutes{" "}
          <button
            type="button"
            onClick={() => {
              setStep("mobile");
              setOtp("");
              setError(null);
            }}
            className="text-accent-warm cursor-pointer hover:underline"
          >
            Change number
          </button>
        </p>
      </div>

      <label className="text-foreground/50 flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={rememberMe}
          onCheckedChange={(checked) => onRememberMeChange(checked === true)}
          className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white"
        />
        Remember me
      </label>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || otpBurned || otp.length !== 6}
        className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Verifying…" : "Verify & Login"}
      </Button>

      <p className="text-foreground/50 text-center text-sm">
        {cooldown > 0 ? (
          <>Resend OTP in {formatTime(cooldown)}</>
        ) : (
          <button
            type="button"
            onClick={() => sendOtp(mobileNumber)}
            disabled={isSubmitting}
            className="text-accent-warm cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resend OTP
          </button>
        )}
      </p>

      <WhatsappSandboxHelper />
    </form>
  );
}
