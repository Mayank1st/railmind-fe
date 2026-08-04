/**
 * OCR KYC — POST /ai/kyc/extract
 *
 * The user photographs their Aadhaar / PAN, the backend reads the printed
 * fields, and the user confirms or corrects them. The AI only *reads*: nothing
 * here saves KYC and nothing here moves `kyc_status` — the confirmed ID number
 * goes to the existing PATCH /auth/update-profile and an admin approves it.
 *
 * Auth-only (cookie session via `withCredentials` on the shared client).
 */

import { api } from "./api";
import {
  DOCUMENT_RULES,
  normalizeIdNumber,
  validateIdNumber,
} from "./document";

export type KycDocumentType = "AADHAAR" | "PAN";

/** Aadhaar's own three values — not the profile's MALE/FEMALE/OTHER set. */
export type KycGender = "MALE" | "FEMALE" | "TRANSGENDER";

/**
 * All six keys always arrive. Which ones can be non-null depends on
 * `document_type`:
 *   AADHAAR → name, aadhaar_number, date_of_birth, gender
 *   PAN     → name, pan_number, date_of_birth, father_name
 *
 * Values arrive normalised (numbers without separators, PAN/gender uppercase).
 * Send them back exactly as received.
 */
export type KycFields = {
  name: string | null;
  date_of_birth: string | null; // ISO date, e.g. "1995-04-12"
  aadhaar_number: string | null;
  gender: KycGender | null;
  pan_number: string | null;
  father_name: string | null;
};

export type KycFieldName = keyof KycFields;

export type KycExtraction = {
  document_type: KycDocumentType;
  /**
   * Storage path into a PRIVATE Supabase bucket — NOT a URL. It exists so
   * support/admin can find the document later. Never put it in an `<img src>`.
   */
  document_path: string;
  fields: KycFields;
  /**
   * Requested but unreadable, so the user has to type them. Drive the form off
   * this, not off `document_type` + nullness — `father_name` is a legitimate
   * null on newer PAN cards.
   */
  unreadable_fields: KycFieldName[];
};

export type KycExtractPayload = {
  document: File;
  document_type: KycDocumentType;
  /** Real upload progress (0–100) so the reading screen isn't a fake spinner. */
  onUploadProgress?: (percent: number) => void;
  /** Lets the user cancel a slow read. */
  signal?: AbortSignal;
};

/** Backend error codes this flow has to tell apart. */
export const KYC_ERROR = {
  FILE_TOO_LARGE: "RM-KYC-001", // 413
  UNSUPPORTED_TYPE: "RM-KYC-002", // 415 — PDF, HEIC, …
  UNDECODABLE: "RM-KYC-003", // 422 — bytes aren't a decodable image
  VISION_FAILED: "RM-KYC-004", // 502 — transient, offer retry + manual
  NUMBER_UNREADABLE: "RM-KYC-005", // 422 — expected in the wild, not a crash
  RATE_LIMITED: "RM-RATE-001", // 429 — 5/min per IP
  DUPLICATE_ID: "RM-AUTH-006", // 409 — on the profile PATCH
} as const;

export const KYC_MAX_BYTES = 5 * 1024 * 1024; // backend cap (RM-KYC-001)
/** `accept` attribute — narrows the picker so RM-KYC-002 rarely fires. */
export const KYC_ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const kycApi = {
  extract: ({
    document: file,
    document_type,
    onUploadProgress,
    signal,
  }: KycExtractPayload) => {
    const form = new FormData();
    form.append("document", file);
    form.append("document_type", document_type);

    return api
      .post<{ data: KycExtraction }>("/ai/kyc/extract", form, {
        // Override the client's JSON default and let axios set the boundary.
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: onUploadProgress
          ? (e) => {
              // `total` is unknown on some transports — fall back to the file size.
              const total = e.total ?? file.size;
              if (total > 0) {
                onUploadProgress(
                  Math.min(100, Math.round((e.loaded / total) * 100))
                );
              }
            }
          : undefined,
      })
      .then((r) => r.data.data);
  },
};

/* ── Picked-file pre-flight ──────────────────────────────────
 * The rate limit is 5/min per IP, so a file the backend is certain to reject
 * should never cost the user an attempt. These checks mirror RM-KYC-001/002.
 */

export type KycFileRejection = {
  title: string;
  detail: string;
};

/** HEIC/HEIF often arrives with an empty `type`, so sniff the name too. */
function isHeic(file: File) {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Rejects a file *type* the backend cannot read (RM-KYC-002). Size is checked
 * separately, after `prepareKycImage` has had a chance to rescue an over-large
 * photo — see `kycSizeRejection`.
 */
export function validateKycFileType(file: File): KycFileRejection | null {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return {
      title: "PDFs cannot be read",
      detail: "Please upload a photo of the card instead — JPEG, PNG or WebP.",
    };
  }

  if (isHeic(file)) {
    return {
      title: "iPhone HEIC photos are not supported yet",
      detail:
        'In Settings → Camera → Formats choose "Most Compatible", then take the photo again. A screenshot of the photo also works.',
    };
  }

  if (!ACCEPTED_MIME.has(file.type.toLowerCase())) {
    return {
      title: "That file type cannot be read",
      detail: "Please upload a JPEG, PNG or WebP photo of the card.",
    };
  }

  return null;
}

/**
 * The over-5-MB message (RM-KYC-001). Takes the size the *user picked*, since
 * that is the number they recognise from their photo library.
 */
export function kycSizeRejection(pickedBytes: number): KycFileRejection {
  return {
    title: "That photo is too large",
    detail: `The file you picked is ${formatMb(pickedBytes)}. Please upload an image under 5 MB — most phones let you share a smaller copy.`,
  };
}

/* ── Client-side downscale ───────────────────────────────────
 * Modern phone cameras produce 8–12 MB files that blow the 5 MB cap. Shrinking
 * before upload turns a hard rejection into an invisible fix, and a 2000px long
 * edge still leaves Aadhaar/PAN text comfortably legible for the reader.
 */

const MAX_EDGE = 2000;
const DOWNSCALE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.9;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () =>
      reject(new Error("Could not decode image"))
    );
    img.src = src;
  });
}

/**
 * Re-encodes an over-large photo down to `MAX_EDGE` on its long side. Returns
 * the ORIGINAL file whenever shrinking isn't needed, isn't possible, or didn't
 * actually help — so the caller can always just use what comes back.
 */
export async function prepareKycImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!ACCEPTED_MIME.has(file.type.toLowerCase())) return file;
  if (file.size <= DOWNSCALE_ABOVE_BYTES) return file;

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const longEdge = Math.max(image.width, image.height);
    const scale = Math.min(1, MAX_EDGE / longEdge);

    // Already small in pixels but heavy in bytes — a plain JPEG re-encode still
    // helps, so keep going with scale = 1.
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "document";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    // Corrupt or exotic image — let the backend be the judge (RM-KYC-003).
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── kyc_status ──────────────────────────────────────────────
 * Only an admin moves this. Nothing the user or the reader does touches it.
 */

export type KycStatusTone = "verified" | "rejected" | "pending";

/**
 * Maps `kyc_status` to how it should read on screen.
 *
 * The backend's own vocabulary is PENDING / PASSED / FAILED, but VERIFIED /
 * APPROVED / REJECTED have all appeared in earlier copies of the API and in the
 * app's older UI code. Every spelling is mapped here so a real "approved" status
 * can never silently fall through to "under review" — which is exactly what
 * happened when PASSED was only checked against VERIFIED/APPROVED.
 *
 * Anything unrecognised is treated as pending: claiming an unknown status is
 * verified would be the one wrong answer here.
 */
export function kycStatusTone(status?: string | null): KycStatusTone {
  switch ((status ?? "").trim().toUpperCase()) {
    case "PASSED":
    case "VERIFIED":
    case "APPROVED":
      return "verified";
    case "FAILED":
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

export function isKycVerified(status?: string | null): boolean {
  return kycStatusTone(status) === "verified";
}

const KYC_STATUS_LABELS: Record<KycStatusTone, string> = {
  verified: "Verified",
  rejected: "Rejected",
  pending: "Under review",
};

/** User-facing wording for a `kyc_status`, whichever spelling it arrives in. */
export function kycStatusLabel(status?: string | null): string {
  return KYC_STATUS_LABELS[kycStatusTone(status)];
}

/* ── Form shape ──────────────────────────────────────────────
 * Every field is a string in the form (empty = not filled) and is converted on
 * submit. Nothing is ever auto-submitted — OCR gets a digit wrong occasionally,
 * and an unchecked Aadhaar is worse than no Aadhaar.
 */

export type KycFormValues = Record<KycFieldName, string>;

export const EMPTY_KYC_FORM: KycFormValues = {
  name: "",
  date_of_birth: "",
  aadhaar_number: "",
  gender: "",
  pan_number: "",
  father_name: "",
};

export const KYC_DOCUMENT_OPTIONS: {
  value: KycDocumentType;
  label: string;
  hint: string;
}[] = [
  { value: "AADHAAR", label: "Aadhaar", hint: "12-digit UIDAI card" },
  { value: "PAN", label: "PAN", hint: "10-character income tax card" },
];

/** Which fields to render, in order, for each document type. */
export const KYC_FIELD_ORDER: Record<KycDocumentType, KycFieldName[]> = {
  AADHAAR: ["name", "aadhaar_number", "date_of_birth", "gender"],
  PAN: ["name", "pan_number", "date_of_birth", "father_name"],
};

/** The ID-number field that belongs to a document type. */
export function kycNumberField(documentType: KycDocumentType): KycFieldName {
  return documentType === "AADHAAR" ? "aadhaar_number" : "pan_number";
}

export type KycFieldKind = "text" | "id-number" | "date" | "gender";

export type KycFieldMeta = {
  label: string;
  kind: KycFieldKind;
  /** Shown under the input while it still needs the user's input. */
  hint: string;
  /**
   * `false` for fields we cannot persist anywhere — shown read-only so the user
   * can confirm the right card was read.
   */
  editable: boolean;
};

export const KYC_FIELD_META: Record<KycFieldName, KycFieldMeta> = {
  name: {
    label: "Full name (as printed)",
    kind: "text",
    hint: "Exactly as printed on the card.",
    editable: true,
  },
  aadhaar_number: {
    label: "Aadhaar number",
    kind: "id-number",
    hint: "Twelve digits, printed under the photo.",
    editable: true,
  },
  pan_number: {
    label: "PAN number",
    kind: "id-number",
    hint: "Ten characters, e.g. ABCDE1234F.",
    editable: true,
  },
  date_of_birth: {
    label: "Date of birth",
    kind: "date",
    hint: "DD/MM/YYYY.",
    editable: true,
  },
  gender: {
    label: "Gender",
    kind: "gender",
    hint: "As printed on the card.",
    editable: true,
  },
  // No profile field accepts a father's name, so there is nowhere to store it.
  // It stays on screen (read-only) purely as a "yes, this is my card" check.
  father_name: {
    label: "Father's name",
    kind: "text",
    hint: "Read from your card. Not stored on your profile.",
    editable: false,
  },
};

export const KYC_GENDER_OPTIONS: { value: KycGender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "TRANSGENDER", label: "Transgender" },
];

/* ── Dates ───────────────────────────────────────────────────
 * The API speaks ISO ("1995-04-12"); the card and the user speak DD/MM/YYYY.
 */

export function isoToDisplayDate(iso: string | null): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

/** `null` when the text isn't a real calendar date. */
export function displayDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  // Round-trip through Date to reject 31/02 and friends.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yyyy}-${mm}-${dd}`;
}

/* ── Display helpers ────────────────────────────────────────── */

/**
 * Groups a 12-digit Aadhaar into "9876 5432 1098" for proof-reading. Purely
 * visual — always `normalizeIdNumber` before sending, or the stored value
 * changes and server-side duplicate detection breaks.
 */
export function groupAadhaarDigits(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "987654321098" → "XXXXXXXX1098" — how the backend masks it back to us. */
export function maskIdNumber(value: string): string {
  const raw = normalizeIdNumber(value);
  if (raw.length <= 4) return raw;
  return "X".repeat(raw.length - 4) + raw.slice(-4);
}

/**
 * Splits a printed full name into the profile's first/last fields. Everything
 * before the final token is the first name — the usual Indian "given +
 * surname" shape, and the only split we can make without guessing.
 */
export function splitFullName(full: string): {
  first_name: string;
  last_name?: string;
} {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] ?? "" };
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

/** Pulls the retry-after out of a rate-limit message ("… in 128 seconds"). */
export function parseRetryAfterSeconds(message: string, fallback = 60): number {
  const match = /(\d+)\s*second/i.exec(message);
  return match ? Number(match[1]) : fallback;
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Validation ─────────────────────────────────────────────── */

export type KycFormErrors = Partial<Record<KycFieldName, string>>;

/**
 * Validates only the fields the given document type actually uses. ID-number
 * format reuses `DOCUMENT_RULES` so this screen agrees with every passenger
 * form in the app.
 */
export function validateKycForm(
  documentType: KycDocumentType,
  values: KycFormValues
): KycFormErrors {
  const errors: KycFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter the name printed on the card.";
  }

  const numberField = kycNumberField(documentType);
  const numberError = validateIdNumber(documentType, values[numberField]);
  if (numberError) {
    errors[numberField] = numberError;
  }

  if (!values.date_of_birth.trim()) {
    errors.date_of_birth = "Enter the date of birth printed on the card.";
  } else {
    const iso = displayDateToIso(values.date_of_birth);
    if (!iso) {
      errors.date_of_birth = "Enter the date as DD/MM/YYYY.";
    } else if (new Date(`${iso}T00:00:00Z`).getTime() > Date.now()) {
      errors.date_of_birth = "Date of birth cannot be in the future.";
    }
  }

  if (documentType === "AADHAAR" && !values.gender) {
    errors.gender = "Select the gender printed on the card.";
  }

  return errors;
}

/**
 * Input cap for the *displayed* number, which includes the grouping spaces
 * (12 Aadhaar digits + 2 spaces = 14).
 */
export function kycNumberMaxLength(documentType: KycDocumentType): number {
  return DOCUMENT_RULES[documentType].maxLength;
}

/** Cap for the stored (separator-free) number. */
export const KYC_RAW_NUMBER_LENGTH: Record<KycDocumentType, number> = {
  AADHAAR: 12,
  PAN: 10,
};

/**
 * Strips whatever the user typed down to the characters the document allows —
 * digits for Aadhaar, uppercase alphanumerics for PAN.
 */
export function sanitizeKycNumber(
  documentType: KycDocumentType,
  input: string
): string {
  const cleaned =
    documentType === "AADHAAR"
      ? input.replace(/\D/g, "")
      : input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, KYC_RAW_NUMBER_LENGTH[documentType]);
}

/** How the raw number is shown on screen (grouped Aadhaar, plain PAN). */
export function formatKycNumber(
  documentType: KycDocumentType,
  raw: string
): string {
  return documentType === "AADHAAR" ? groupAadhaarDigits(raw) : raw;
}
