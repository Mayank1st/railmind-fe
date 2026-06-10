"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, UserCheck, Ticket, BellRing, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { toApiError } from "@/lib/api";
import { authApi } from "@/lib/auth";
import type { UpdateProfilePayload } from "@/lib/profile";
import { useAuthStore } from "@/store/auth";

// Backend `user_profiles` has gender + marital_status as NOT NULL, so this
// onboarding step makes those required (alongside name + mobile). Names are
// prefilled from Google's suggestion (?fn/?ln) but stay editable, since Google
// names can be junk (e.g. "040-Mayank"). Mobile is saved via update-profile but
// stays UNVERIFIED until SMS OTP ships (Phase B); a duplicate number comes back
// as RM-AUTH-010 (409).
const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const;
const MARITAL_OPTIONS = [
  "UNMARRIED",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
] as const;

// Constraints mirror the backend UpdateUserProfileDTO (e.g. names min_length=2).
const schema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.enum(GENDER_OPTIONS, { message: "Select your gender" }),
  marital_status: z.enum(MARITAL_OPTIONS, {
    message: "Select your marital status",
  }),
  // 10 digits after stripping spaces/dashes (same normalization the backend
  // applies, so the uniqueness check sees one canonical form).
  mobile: z.string().refine((v) => /^\d{10}$/.test(v.replace(/[\s-]/g, "")), {
    message: "Enter a valid 10-digit mobile number",
  }),
  date_of_birth: z.string().optional(),
});

/** Strip spaces/dashes so the backend uniqueness check sees a canonical number. */
function normalizeMobile(value: string) {
  return value.replace(/[\s-]/g, "");
}

type FormData = z.infer<typeof schema>;

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") ?? "/";
  const fnParam = searchParams.get("fn") ?? "";
  const lnParam = searchParams.get("ln") ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: fnParam,
      last_name: lnParam,
      gender: undefined,
      marital_status: undefined,
      mobile: "",
      date_of_birth: "",
    },
  });

  const selectedGender = watch("gender");
  const selectedMarital = watch("marital_status");

  // Prefill once from the server profile (Google's suggested names win, since
  // a returning-but-incomplete user may already have some fields set).
  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current || !profile) return;
    didPrefill.current = true;

    // If the profile is already complete, skip onboarding entirely.
    if (profile.first_name && profile.gender && profile.marital_status) {
      router.replace(nextPath);
      return;
    }

    reset({
      first_name: fnParam || profile.first_name || "",
      last_name: lnParam || profile.last_name || "",
      gender: GENDER_OPTIONS.includes(
        profile.gender as (typeof GENDER_OPTIONS)[number]
      )
        ? (profile.gender as (typeof GENDER_OPTIONS)[number])
        : undefined,
      marital_status: MARITAL_OPTIONS.includes(
        profile.marital_status as (typeof MARITAL_OPTIONS)[number]
      )
        ? (profile.marital_status as (typeof MARITAL_OPTIONS)[number])
        : undefined,
      mobile: profile.mobile_number || "",
      date_of_birth: profile.date_of_birth || "",
    });
  }, [profile, reset, router, nextPath, fnParam, lnParam]);

  const onSubmit = async (form: FormData) => {
    setSubmitError(null);
    const payload: UpdateProfilePayload = {
      first_name: form.first_name,
      last_name: form.last_name,
      gender: form.gender,
      marital_status: form.marital_status,
      mobile_number: normalizeMobile(form.mobile),
    };
    if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;

    try {
      await update.mutateAsync(payload);
      // Re-fetch the full user from /auth/me so the auth store gets profile_photo
      // and any other fields the PATCH response may not return.
      const freshUser = await authApi.me();
      setUser(freshUser);
      router.replace(nextPath);
      router.refresh();
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
              One last step
            </span>

            {/* Heading */}
            <h1 className="text-foreground text-[48px] leading-[1.05] font-normal tracking-[-1px]">
              Set up your profile
              <br />
              travel the smarter way
            </h1>

            {/* Subtext */}
            <p className="text-foreground/50 mt-4 max-w-md text-[17px]">
              A complete profile unlocks instant bookings, personalised alerts,
              and a seamless experience every time you travel.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Ticket className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Instant ticket booking
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Skip re-entering details — book in seconds every time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <BellRing className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Smart travel alerts
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Tatkal windows, PNR updates, and seat availability on your
                    routes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Users className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Saved passengers
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Add family members once, select them at checkout with one
                    tap
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE — Form ── */}
        <div className="flex w-1/2 items-center justify-end px-8 py-10">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121713] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_-12px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <span className="border-accent-warm/30 text-accent-warm mb-5 inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
              <UserCheck className="h-4 w-4" />
              One last step
            </span>
            <h2 className="text-foreground text-2xl font-semibold">
              Complete your profile
            </h2>
            <p className="text-foreground/50 mt-1 text-sm">
              We need a few details to book tickets and send you updates. This
              takes about a minute.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {/* First + Last name */}
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

              {/* Mobile */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Mobile
                </label>
                <div className="flex gap-2">
                  <span className="text-foreground/70 flex items-center rounded-lg bg-[#2a2a28] px-3 py-3 text-sm">
                    +91
                  </span>
                  <input
                    {...register("mobile")}
                    inputMode="numeric"
                    placeholder="9334484911"
                    className="text-foreground flex-1 rounded-lg bg-[#2a2a28] px-4 py-3 text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                {errors.mobile ? (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.mobile.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/30">
                    We&apos;ll verify this later via OTP.
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setValue("gender", g, { shouldValidate: true })
                      }
                      className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium ${
                        selectedGender === g
                          ? "bg-accent-warm text-white"
                          : "text-foreground/60 hover:text-foreground bg-[#2a2a28]"
                      }`}
                    >
                      {titleCase(g)}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Marital status */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Marital Status
                </label>
                <Select
                  value={selectedMarital ?? ""}
                  onValueChange={(v) =>
                    setValue(
                      "marital_status",
                      v as FormData["marital_status"],
                      {
                        shouldValidate: true,
                      }
                    )
                  }
                >
                  <SelectTrigger className="text-foreground !h-auto w-full cursor-pointer rounded-lg border-0 bg-[#2a2a28] px-4 py-3 text-sm">
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#2a2a28] [&_[data-slot=select-item]]:cursor-pointer">
                    {MARITAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {titleCase(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.marital_status && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.marital_status.message}
                  </p>
                )}
              </div>

              {/* Date of birth (optional) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wider text-white/40 uppercase">
                  Date of Birth{" "}
                  <span className="text-white/25 normal-case">(optional)</span>
                </label>
                <input
                  {...register("date_of_birth")}
                  type="date"
                  className="text-foreground w-full rounded-lg bg-[#2a2a28] px-4 py-3 text-sm [color-scheme:dark] outline-none placeholder:text-white/30"
                />
              </div>

              {submitError && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={update.isPending}
                className="w-full cursor-pointer rounded-lg bg-[#E8AA4D] py-6 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {update.isPending ? "Saving…" : "Complete profile"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
