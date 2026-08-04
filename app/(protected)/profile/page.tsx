"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { differenceInYears, format, isValid, parseISO } from "date-fns";
import {
  BadgeCheck,
  Check,
  Clock,
  Loader2,
  Mail,
  Monitor,
  Pencil,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { useAuthStore } from "@/store/auth";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";
import { toApiError } from "@/lib/api";
import { isKycVerified, kycStatusLabel, kycStatusTone } from "@/lib/kyc";
import type { PersonalProfileFields } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { PhotoCropDialog } from "@/components/profile/photo-crop-dialog";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const KYC_HREF = "/profile/kyc";

/**
 * Deep link into the capture flow. Naming a document type both preselects it and
 * unlocks it for replacement — without one, a type already on the account is
 * locked in the wizard so the user cannot re-submit it by accident.
 */
function kycHref(documentType?: "AADHAAR" | "PAN") {
  return documentType ? `${KYC_HREF}?document=${documentType}` : KYC_HREF;
}

type TabId = "personal" | "contact" | "security" | "kyc" | "notifications";

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "security", label: "Security", badge: "Coming soon" },
  { id: "kyc", label: "KYC" },
  { id: "notifications", label: "Notifications", badge: "Coming soon" },
];

const DEFAULT_TAB: TabId = "personal";

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function getInitials(
  first?: string | null,
  last?: string | null,
  email?: string | null
) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const storeUser = useAuthStore((s) => s.user);

  // The tab lives in the URL (`/profile?tab=kyc`) so a deep link — or the back
  // arrow out of a sub-flow like KYC capture — lands on the tab the user came
  // from. Switching tabs `replace`s rather than pushes, so browsing the tabs
  // doesn't fill the back stack.
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : DEFAULT_TAB;

  function selectTab(next: string) {
    if (!isTabId(next) || next === tab) return;
    router.replace(next === DEFAULT_TAB ? "/profile" : `/profile?tab=${next}`, {
      scroll: false,
    });
  }

  const upload = useUploadProfilePhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const firstName = profile?.first_name ?? storeUser?.first_name ?? "";
  const lastName = profile?.last_name ?? storeUser?.last_name ?? "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
  const email = profile?.email ?? storeUser?.email ?? "";
  const phone = profile?.mobile_number ?? storeUser?.mobile ?? "";
  const emailVerified = profile?.is_email_verified ?? false;
  const photo = profile?.profile_photo;
  const initials = getInitials(firstName, lastName, email);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-selected
    if (!file) return;
    // Client-side guard before hitting the API.
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be under 5 MB.");
      return;
    }
    setPhotoError(null);
    // Open the cropper instead of uploading raw — user frames the square first.
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function handleCropped(file: File) {
    closeCrop();
    upload.mutate(file);
  }

  return (
    <div className="app-container-narrow py-10">
      {/* ── HEADER ── */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <ProfileAvatar src={photo} initials={initials} alt={fullName} />

          <div className="min-w-0">
            <h1 className="font-heading text-foreground text-[22px] leading-[1.1] font-normal tracking-[-0.5px] break-words sm:text-4xl sm:leading-tight lg:text-5xl">
              {fullName}
            </h1>
            <div className="text-muted-foreground mt-2 flex flex-col gap-1.5 text-sm sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              <span className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{email || "—"}</span>
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                {phone ? `+91 ${phone}` : "—"}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  emailVerified ? "text-emerald-400" : "text-amber-400"
                )}
              >
                <BadgeCheck className="h-4 w-4 shrink-0" />
                {emailVerified ? "Email verified" : "Email not verified"}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickPhoto}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="w-full cursor-pointer rounded-full border-white/15 bg-transparent px-5 text-sm font-medium text-white/90 hover:bg-white/[0.04] sm:w-auto"
          >
            {upload.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {upload.isPending ? "Uploading…" : "Update photo"}
          </Button>
          {(photoError || upload.isError) && (
            <p className="mt-2 text-left text-xs text-red-400 sm:text-right">
              {photoError ?? toApiError(upload.error).message}
            </p>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <Tabs value={tab} onValueChange={selectTab} className="mt-8 gap-0">
        {/* Scrolls horizontally on narrow screens instead of overflowing the
            page; -mb-px keeps the active underline sitting on the border. */}
        <div className="overflow-x-auto border-b border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            variant="line"
            className="-mb-px h-auto w-max justify-start gap-1 rounded-none border-0 p-0"
          >
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="text-muted-foreground data-active:text-foreground flex-none gap-2 px-4 py-3 after:-bottom-px after:bg-[#E8AA4D] data-active:font-medium"
              >
                {t.label}
                {t.badge && (
                  <Badge className="h-5 bg-[#3d2817] px-2 text-[10px] font-semibold tracking-wide text-[#E8AA4D]">
                    {t.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="personal" className="mt-8">
          <PersonalTab />
        </TabsContent>
        <TabsContent value="contact" className="mt-8">
          <ContactTab />
        </TabsContent>
        <TabsContent value="security" className="mt-8">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="kyc" className="mt-8">
          <KycTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-8">
          <NotificationsTab />
        </TabsContent>
      </Tabs>

      <PhotoCropDialog
        imageSrc={cropSrc}
        onCancel={closeCrop}
        onCropped={handleCropped}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];
const MARITAL_OPTIONS = ["UNMARRIED", "MARRIED", "DIVORCED", "WIDOWED"];

function PersonalTab() {
  // 3rd layer: call the hook. React Query gives us data + request state.
  const { data, isLoading } = useProfile();
  const update = useUpdateProfile();
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PersonalProfileFields>({});

  function startEdit() {
    if (!data) return;
    setForm({
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      marital_status: data.marital_status,
      nationality: data.nationality,
      occupation: data.occupation,
    });
    update.reset();
    setEditing(true);
  }

  function cancel() {
    update.reset();
    setEditing(false);
  }

  async function save() {
    if (!data) return;
    // Diff against the original — send ONLY changed keys, like the curl example.
    const changed: PersonalProfileFields = {};
    (Object.keys(form) as (keyof PersonalProfileFields)[]).forEach((k) => {
      if (form[k] !== data[k]) changed[k] = form[k];
    });
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    try {
      const updated = await update.mutateAsync(changed);
      // Keep the navbar (auth store) name in sync with the edit.
      if (storeUser) {
        setUser({
          ...storeUser,
          first_name: updated.first_name,
          last_name: updated.last_name,
        });
      }
      setEditing(false);
    } catch {
      // error surfaced inline via update.isError below
    }
  }

  const set = (k: keyof PersonalProfileFields) => (value: string) =>
    setForm((f) => ({ ...f, [k]: value }));

  return (
    <div className="space-y-6">
      {/* Personal information */}
      <SectionCard
        title="Personal information"
        action={
          editing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancel}
                disabled={update.isPending}
                className="rounded-full text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={update.isPending}
                className="rounded-full bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
              >
                {update.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          ) : (
            <SectionAction
              icon={<Pencil className="h-3.5 w-3.5" />}
              onClick={startEdit}
              disabled={isLoading || !data}
            >
              Edit
            </SectionAction>
          )
        }
      >
        {editing ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <EditField
              label="First name"
              value={form.first_name ?? ""}
              onChange={set("first_name")}
            />
            <EditField
              label="Last name"
              value={form.last_name ?? ""}
              onChange={set("last_name")}
            />
            <EditField
              label="Date of birth"
              type="date"
              value={form.date_of_birth ?? ""}
              onChange={set("date_of_birth")}
            />
            <EditSelect
              label="Gender"
              value={form.gender ?? ""}
              options={GENDER_OPTIONS}
              onChange={set("gender")}
            />
            <EditSelect
              label="Marital status"
              value={form.marital_status ?? ""}
              options={MARITAL_OPTIONS}
              onChange={set("marital_status")}
            />
            <EditField
              label="Nationality"
              value={form.nationality ?? ""}
              onChange={set("nationality")}
            />
            <EditField
              label="Occupation"
              value={form.occupation ?? ""}
              onChange={set("occupation")}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
            <Field
              label="Full name"
              value={[data?.first_name, data?.last_name]
                .filter(Boolean)
                .join(" ")}
              loading={isLoading}
            />
            <Field
              label="Date of birth"
              value={formatDob(data?.date_of_birth)}
              loading={isLoading}
            />
            <Field
              label="Gender"
              value={titleCase(data?.gender)}
              loading={isLoading}
            />
            <Field
              label="Marital status"
              value={titleCase(data?.marital_status)}
              loading={isLoading}
            />
            <Field
              label="Nationality"
              value={titleCase(data?.nationality)}
              loading={isLoading}
            />
            <Field
              label="Occupation"
              value={titleCase(data?.occupation)}
              loading={isLoading}
            />
          </div>
        )}

        {update.isError && (
          <p className="mt-5 text-sm text-red-400">
            {toApiError(update.error).message}
          </p>
        )}
      </SectionCard>

      {/* Account & preferences */}
      <SectionCard
        title="Account & preferences"
        action={
          <SectionAction icon={<Settings className="h-3.5 w-3.5" />} disabled>
            Manage
          </SectionAction>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          <Field label="Username" value={data?.username} loading={isLoading} />
          <Field
            label="Role"
            value={titleCase(data?.role)}
            loading={isLoading}
          />
          <Field
            label="Preferred language"
            value={data?.preferred_language}
            loading={isLoading}
          />
          <Field
            label="KYC status"
            loading={isLoading}
            value={data && <StatusPill status={data.kyc_status} />}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function ContactTab() {
  const { data, isLoading } = useProfile();

  return (
    <div className="space-y-6">
      {/* Contact details */}
      <SectionCard
        title="Contact details"
        action={
          <SectionAction icon={<Pencil className="h-3.5 w-3.5" />} soon>
            Edit
          </SectionAction>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          <Field
            label="Email"
            loading={isLoading}
            value={
              data && (
                <span className="flex items-center gap-2">
                  {data.email}
                  <VerifyPill ok={data.is_email_verified} />
                </span>
              )
            }
          />
          <Field
            label="Mobile number"
            loading={isLoading}
            value={
              data && (
                <span className="flex items-center gap-2">
                  {data.mobile_number ? `+91 ${data.mobile_number}` : "—"}
                  <VerifyPill ok={data.is_mobile_verified} />
                </span>
              )
            }
          />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard
        title="Address"
        action={
          <SectionAction icon={<Settings className="h-3.5 w-3.5" />} soon>
            Manage
          </SectionAction>
        }
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          <Field
            label="Address line 1"
            value={data?.address_line1}
            loading={isLoading}
          />
          <Field label="Street" value={data?.street} loading={isLoading} />
          <Field
            label="State"
            value={titleCase(data?.state)}
            loading={isLoading}
          />
          <Field label="PIN code" value={data?.pin_code} loading={isLoading} />
          <Field
            label="Country"
            value={titleCase(data?.country)}
            loading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  );
}

/** "1993-06-14" → "14 June 1993 · 32 yrs" (returns undefined if missing/invalid). */
function formatDob(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = parseISO(iso);
  if (!isValid(d)) return undefined;
  return `${format(d, "d MMMM yyyy")} · ${differenceInYears(new Date(), d)} yrs`;
}

/** "UNMARRIED" → "Unmarried", "PREFERRED_LANG" → "Preferred Lang". */
function titleCase(s?: string): string | undefined {
  if (!s) return undefined;
  return s
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Coloured pill for a verification flag (email / mobile). */
function VerifyPill({ ok }: { ok?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        ok
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-amber-500/15 text-amber-300"
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      {ok ? "Verified" : "Not verified"}
    </span>
  );
}

/** Coloured pill for `kyc_status` (PENDING / PASSED / FAILED). */
function StatusPill({ status }: { status?: string }) {
  if (!status) return <>—</>;
  const tone = kycStatusTone(status);
  const cls =
    tone === "verified"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "rejected"
        ? "bg-red-500/15 text-red-300"
        : "bg-amber-500/15 text-amber-300";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cls
      )}
    >
      {kycStatusLabel(status)}
    </span>
  );
}

/* ── SECURITY TAB ─────────────────────────────────────────── */

function SecurityTab() {
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <SectionCard title="Sign-in & password">
        <div className="divide-y divide-white/8">
          <Row
            title="Password"
            subtitle="Last changed 14 days ago"
            trailing={
              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-transparent text-sm text-white/90 hover:bg-white/[0.04]"
              >
                Change password
              </Button>
            }
          />
          <Row
            title="Two-factor authentication"
            subtitle="Off · Add via SMS or authenticator app"
            trailing={
              <Button className="rounded-full bg-[#E8AA4D] text-sm font-medium text-[#3d2817] hover:bg-[#D09840]">
                Enable 2FA
              </Button>
            }
          />
          <Row
            title="Login alerts"
            subtitle="Email me on new device sign-in"
            trailing={
              <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
            }
          />
          <Row
            title="Google account"
            subtitle="Linked · ananya.s@gmail.com"
            trailing={
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium text-red-400 hover:text-red-300"
              >
                Unlink
              </Button>
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Active sessions">
        <div className="divide-y divide-white/8">
          <Row
            leading={
              <IconSquare>
                <Monitor className="h-4 w-4" />
              </IconSquare>
            }
            title={
              <span className="flex items-center gap-2">
                Chrome · MacBook Pro
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-300 uppercase">
                  This device
                </span>
              </span>
            }
            subtitle="Mumbai, IN · Current session"
          />
          <Row
            leading={
              <IconSquare>
                <Smartphone className="h-4 w-4" />
              </IconSquare>
            }
            title="RailMind App · iPhone 15"
            subtitle="Mumbai, IN · 2 hours ago"
            trailing={
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium text-red-400 hover:text-red-300"
              >
                Sign out
              </Button>
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── KYC TAB ──────────────────────────────────────────────── */

function KycTab() {
  const { data, isLoading } = useProfile();

  const pan = data?.pan_number;
  const aadhaar = data?.adhaar_number;
  const kyc = data?.kyc_status;
  const kycComplete = isKycVerified(kyc);

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-gradient-to-r from-[#3a2a12] to-[#241a0c] px-5 py-4 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
        <p className="text-white/80">
          <span className="font-semibold text-[#F0BF6A]">
            Photograph your card.
          </span>{" "}
          We read the printed details for you, you check them, then an officer
          approves it — that unlocks Tatkal, ladies quota and senior citizen
          concession bookings. Documents are encrypted and never shown in full.
        </p>
      </div>

      {/* Identity documents */}
      <SectionCard
        title="Identity documents"
        action={
          <KycLink>
            <Plus className="h-3.5 w-3.5" />
            Add document
          </KycLink>
        }
      >
        {isLoading ? (
          <div className="space-y-3 py-1">
            <div className="h-12 animate-pulse rounded-lg bg-white/5" />
            <div className="h-12 animate-pulse rounded-lg bg-white/5" />
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            <DocRow
              title="PAN card"
              meta={pan ?? "Not added · Required for Tatkal"}
              trailing={
                pan ? (
                  <LinkedDocActions status={kyc} documentType="PAN" />
                ) : (
                  <UploadButton documentType="PAN" />
                )
              }
            />
            <DocRow
              title="Aadhaar"
              meta={
                aadhaar
                  ? groupAadhaar(aadhaar)
                  : "Not linked · Required for Tatkal"
              }
              trailing={
                aadhaar ? (
                  <LinkedDocActions status={kyc} documentType="AADHAAR" />
                ) : (
                  <UploadButton documentType="AADHAAR" />
                )
              }
            />
          </div>
        )}
      </SectionCard>

      {/* Verification status */}
      <SectionCard title="Verification status">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatusTile
              state={pan ? "complete" : "pending"}
              label="PAN card"
              status={pan ? "Linked" : "Not added"}
            />
            <StatusTile
              state={aadhaar ? "complete" : "pending"}
              label="Aadhaar"
              status={aadhaar ? "Linked" : "Not linked"}
            />
            <StatusTile
              state={kycComplete ? "complete" : "pending"}
              label="KYC review"
              status={kyc ? kycStatusLabel(kyc) : "—"}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function DocRow({
  title,
  meta,
  trailing,
}: {
  title: string;
  meta: string;
  trailing: React.ReactNode;
}) {
  return (
    <Row
      leading={
        <IconSquare>
          <ShieldCheck className="h-4 w-4" />
        </IconSquare>
      }
      title={title}
      subtitle={meta}
      trailing={trailing}
    />
  );
}

function UploadButton({ documentType }: { documentType: "AADHAAR" | "PAN" }) {
  return (
    <Button
      asChild
      variant="outline"
      className="rounded-full border-white/15 bg-transparent text-sm text-white/90 hover:bg-white/[0.04]"
    >
      <Link href={kycHref(documentType)}>
        <Upload className="h-4 w-4" />
        Upload
      </Link>
    </Button>
  );
}

/** Amber text link into the KYC capture flow — matches `SectionAction`. */
function KycLink({
  documentType,
  children,
}: {
  documentType?: "AADHAAR" | "PAN";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={kycHref(documentType)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8AA4D] hover:text-[#F0BF6A]"
    >
      {children}
    </Link>
  );
}

/**
 * Status badge for a linked document, plus a way back into the capture flow —
 * a rejected or still-pending document is the exact case where the user needs
 * to send a better photo.
 */
function LinkedDocActions({
  status,
  documentType,
}: {
  status?: string;
  documentType: "AADHAAR" | "PAN";
}) {
  return (
    <div className="flex items-center gap-3">
      {kycDocBadge(status)}
      {!isKycVerified(status) && (
        <KycLink documentType={documentType}>Replace</KycLink>
      )}
    </div>
  );
}

/** Maps the overall `kyc_status` to a document badge. */
function kycDocBadge(status?: string) {
  const tone = kycStatusTone(status);
  const variant = tone === "pending" ? "review" : tone;
  return <StatusBadge variant={variant}>{kycStatusLabel(status)}</StatusBadge>;
}

/** "XXXXXXXX1236" → "XXXX XXXX 1236". */
function groupAadhaar(s: string) {
  return s.replace(/(.{4})(?=.)/g, "$1 ");
}

function StatusBadge({
  variant,
  children,
}: {
  variant: "verified" | "review" | "rejected";
  children: React.ReactNode;
}) {
  const cls =
    variant === "verified"
      ? "bg-emerald-500/15 text-emerald-300"
      : variant === "rejected"
        ? "bg-red-500/15 text-red-300"
        : "bg-amber-500/15 text-amber-300";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        cls
      )}
    >
      {variant === "verified" ? (
        <Check className="h-3 w-3" />
      ) : variant === "rejected" ? (
        <X className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {children}
    </span>
  );
}

function StatusTile({
  state,
  label,
  status,
}: {
  state: "complete" | "pending";
  label: string;
  status: string;
}) {
  const complete = state === "complete";
  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-5",
        complete
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-white/8 bg-white/[0.02]"
      )}
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          complete ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60"
        )}
      >
        {complete ? (
          <Check className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>
      <p className="text-foreground mt-2.5 text-[13px] leading-tight font-medium sm:mt-3 sm:text-[15px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xs sm:text-sm",
          complete ? "text-emerald-300/80" : "text-muted-foreground"
        )}
      >
        {status}
      </p>
    </div>
  );
}

/* ── NOTIFICATIONS TAB ────────────────────────────────────── */

const NOTIFY_CHANNELS = ["Email", "SMS", "WhatsApp", "Push"];

const NOTIFY_ROWS: {
  title: string;
  subtitle: string;
  channels: [boolean, boolean, boolean, boolean];
}[] = [
  {
    title: "Booking confirmations",
    subtitle: "PNR, e-ticket, payment receipts",
    channels: [true, true, true, true],
  },
  {
    title: "PNR & chart updates",
    subtitle: "Waitlist movement, berth allotment",
    channels: [true, true, true, false],
  },
  {
    title: "Journey reminders",
    subtitle: "Departure alerts, platform changes",
    channels: [false, true, true, true],
  },
  {
    title: "Refund status",
    subtitle: "Cancellation and refund tracking",
    channels: [true, true, false, false],
  },
  {
    title: "Offers & recommendations",
    subtitle: "AI route tips, fare drops, Tatkal alerts",
    channels: [true, false, false, true],
  },
];

function NotificationsTab() {
  const [matrix, setMatrix] = useState(() =>
    NOTIFY_ROWS.map((r) => [...r.channels])
  );
  const [dnd, setDnd] = useState(true);

  const toggleCell = (row: number, col: number) =>
    setMatrix((m) =>
      m.map((r, i) => (i === row ? r.map((c, j) => (j === col ? !c : c)) : r))
    );

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 border-white/8 shadow-none">
        <CardContent className="p-5 sm:p-8 sm:pt-6">
          {/* The channel matrix needs a minimum width to stay readable, so it
              scrolls sideways on phones rather than squashing the toggles. */}
          <div className="-mx-5 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[460px]">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(4,64px)] items-center gap-4 border-b border-white/8 pb-4">
                <span className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
                  Notify me about
                </span>
                {NOTIFY_CHANNELS.map((c) => (
                  <span
                    key={c}
                    className="text-muted-foreground text-center text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/8">
                {NOTIFY_ROWS.map((r, ri) => (
                  <div
                    key={r.title}
                    className="grid grid-cols-[1fr_repeat(4,64px)] items-center gap-4 py-5"
                  >
                    <div>
                      <p className="text-foreground text-[15px] font-medium">
                        {r.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {r.subtitle}
                      </p>
                    </div>
                    {r.channels.map((_, ci) => (
                      <div key={ci} className="flex justify-center">
                        <Switch
                          checked={matrix[ri][ci]}
                          onCheckedChange={() => toggleCell(ri, ci)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionCard title="Quiet hours">
        <Row
          title="Do not disturb"
          subtitle="Mute non-critical alerts 10:00 PM – 7:00 AM"
          trailing={<Switch checked={dnd} onCheckedChange={setDnd} />}
        />
      </SectionCard>
    </div>
  );
}

/* ── SHARED ROW / TOGGLE PRIMITIVES ───────────────────────── */

function Row({
  leading,
  title,
  subtitle,
  trailing,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <div className="text-foreground text-[15px] font-medium">{title}</div>
          {subtitle && (
            <div className="text-muted-foreground mt-0.5 text-sm">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {trailing}
    </div>
  );
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/70">
      {children}
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-7">
          <h2 className="font-heading text-foreground text-lg font-medium sm:text-xl">
            {title}
          </h2>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function SectionAction({
  icon,
  children,
  onClick,
  disabled,
  soon,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  soon?: boolean;
}) {
  // Action isn't built yet — show a badge in place of the clickable link.
  if (soon) return <ComingSoonBadge />;
  return (
    <Button
      variant="link"
      onClick={onClick}
      disabled={disabled}
      className="h-auto gap-1.5 p-0 text-sm font-medium text-[#E8AA4D] no-underline hover:text-[#F0BF6A] hover:no-underline"
    >
      {icon}
      {children}
    </Button>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-muted-foreground text-xs tracking-[0.12em] uppercase"
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
      />
    </div>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  // Make sure the current value is always selectable, even if it's outside the
  // known option list (e.g. backend adds a new enum value).
  const opts =
    value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-muted-foreground text-xs tracking-[0.12em] uppercase"
      >
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="h-10 w-full bg-[#2a2a28] text-[15px] data-[size=default]:h-10 dark:bg-[#2a2a28] dark:hover:bg-[#2f2f2d]"
        >
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o} value={o}>
              {titleCase(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Field({
  label,
  value,
  loading,
}: {
  label: string;
  value?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-5 w-28 animate-pulse rounded bg-white/5" />
      ) : (
        <div className="text-foreground mt-2 text-[15px]">{value || "—"}</div>
      )}
    </div>
  );
}
