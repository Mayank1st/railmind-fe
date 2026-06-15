"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { authApi } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    email: z.string().email("Invalid email address"),
    country_code: z.string(),
    mobile: z
      .string()
      .min(10, "Mobile must be 10 digits")
      .max(10, "Mobile must be 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    gender: z.enum(["female", "male", "other"]),
    terms: z.boolean().refine((value) => value, {
      message: "You must accept the terms",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country_code: "+91",
      gender: undefined,
    },
  });

  const selectedGender = watch("gender");

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { confirm_password, terms, ...payload } = data;
      void confirm_password;
      void terms;
      await authApi.register(payload);
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
              2-min signup
            </span>

            {/* Heading */}
            <h1 className="text-foreground text-[48px] leading-[1.05] font-normal tracking-[-1px]">
              Create your RailMind
              <br />
              account
            </h1>

            {/* Subtext */}
            <p className="text-foreground/65 mt-4 max-w-md text-[17px]">
              One profile for all your trips. Saved passengers, instant
              rebooking, and AI confirmation predictions.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <ShieldCheck className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Secure by design
                  </p>
                  <p className="text-foreground/55 text-sm">
                    Aadhaar / PAN verified, encrypted at rest
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Sparkles className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    AI predictions
                  </p>
                  <p className="text-foreground/55 text-sm">
                    Confirm-probability before you book
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <FileText className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Auto e-tickets
                  </p>
                  <p className="text-foreground/55 text-sm">
                    PDF + WhatsApp delivery, all in one place
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
            <h2 className="text-foreground text-2xl font-semibold">Sign up</h2>
            <p className="text-foreground/50 mt-1 text-sm">
              Already have one?{" "}
              <Link href="/login" className="text-accent-warm hover:underline">
                Login
              </Link>
            </p>

            {/* Google sign-in (GIS official button, themed dark). Backend
                auto-detects signup vs login and returns is_new_user. */}
            <GoogleSignInButton onError={setSubmitError} />

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs tracking-wider text-white/30 uppercase">
                or sign up with email
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* First Name + Last Name */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                    First Name
                  </label>
                  <input
                    {...register("first_name")}
                    placeholder="Ananya"
                    className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                    Last Name
                  </label>
                  <input
                    {...register("last_name")}
                    placeholder="Sharma"
                    className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Date of Birth
                </label>
                <input
                  {...register("date_of_birth")}
                  placeholder="14 / 06 / 1993"
                  className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.date_of_birth.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="ananya.s@example.com"
                  className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Mobile
                </label>
                <div className="flex gap-2">
                  <Select
                    value={watch("country_code")}
                    onValueChange={(v) =>
                      setValue("country_code", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="text-foreground !h-auto w-24 cursor-pointer rounded-lg border-0 bg-[#2a2a28] px-3 py-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={4}
                      className="!min-w-[var(--radix-select-trigger-width)] border-white/10 bg-[#2a2a28] [&_[data-slot=select-item]]:cursor-pointer"
                    >
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    {...register("mobile")}
                    placeholder="93344 84911"
                    className="text-foreground flex-1 rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.mobile.message}
                  </p>
                )}
              </div>

              {/* Password + Confirm */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
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
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirm_password")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 pr-10 text-sm outline-none placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["female", "male", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue("gender", g)}
                      className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium capitalize ${
                        selectedGender === g
                          ? "bg-accent-warm text-white"
                          : "text-foreground/60 hover:text-foreground bg-[#2a2a28]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="text-foreground/50 flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  onCheckedChange={(c) => setValue("terms", c === true)}
                  className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm mt-0.5 cursor-pointer !border-white/30 !bg-white"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-accent-warm hover:underline"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-accent-warm hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  . I consent to OTP verification via email.
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-red-400">{errors.terms.message}</p>
              )}

              {submitError && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {submitError}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
