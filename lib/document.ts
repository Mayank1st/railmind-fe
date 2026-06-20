/**
 * Government ID validation — single source of truth.
 *
 * These documents are sensitive, so format + minimum-length rules live here and
 * are reused by every passenger form (saved passengers, booking flow). A bare
 * "more than 3 chars" check let `123456` pass as an Aadhaar — these per-type
 * patterns stop that.
 *
 * Each pattern is tested against the NORMALIZED value (uppercased, separators
 * stripped) so users may type spaces/hyphens and still validate.
 */

export type IdType =
  | "AADHAAR"
  | "PASSPORT"
  | "VOTER_ID"
  | "DRIVING_LICENSE"
  | "PAN";

export type DocumentRule = {
  label: string;
  /** Tested against the normalized (uppercased, separator-free) value. */
  pattern: RegExp;
  /** Placeholder / format hint shown in the input. */
  example: string;
  /** Input cap (allows a little room for separators while typing). */
  maxLength: number;
  /** User-facing message when the format/length is wrong. */
  message: string;
};

export const DOCUMENT_RULES: Record<IdType, DocumentRule> = {
  // 12 digits, never starting 0/1 (UIDAI rule).
  AADHAAR: {
    label: "Aadhaar",
    pattern: /^[2-9][0-9]{11}$/,
    example: "1234 5678 9012",
    maxLength: 14,
    message: "Aadhaar must be 12 digits.",
  },
  // 1 letter + 7 digits, e.g. A1234567.
  PASSPORT: {
    label: "Passport",
    pattern: /^[A-Z][0-9]{7}$/,
    example: "A1234567",
    maxLength: 8,
    message: "Passport must be 1 letter followed by 7 digits (e.g. A1234567).",
  },
  // EPIC: 3 letters + 7 digits, e.g. ABC1234567.
  VOTER_ID: {
    label: "Voter ID",
    pattern: /^[A-Z]{3}[0-9]{7}$/,
    example: "ABC1234567",
    maxLength: 10,
    message:
      "Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567).",
  },
  // 2 letters (state) + 2 digits (RTO) + 11 digits, 15 chars total.
  DRIVING_LICENSE: {
    label: "Driving License",
    pattern: /^[A-Z]{2}[0-9]{13}$/,
    example: "MH1220190001234",
    maxLength: 18,
    message:
      "Driving licence must be 2 letters followed by 13 digits (15 total).",
  },
  // PAN: AAAAA9999A.
  PAN: {
    label: "PAN",
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    example: "ABCDE1234F",
    maxLength: 10,
    message:
      "PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F).",
  },
};

/** Uppercase + strip spaces/hyphens so typed separators don't break validation. */
export function normalizeIdNumber(raw: string): string {
  return (raw ?? "").replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Returns a user-facing error string if the ID number is missing or malformed
 * for its type, or `null` when valid. Unknown types fall back to a minimal
 * non-empty check so the form never silently blocks an unmapped document.
 */
export function validateIdNumber(
  idType: string | null | undefined,
  raw: string
): string | null {
  const value = normalizeIdNumber(raw);
  if (!value) return "ID number is required.";

  const rule = idType ? DOCUMENT_RULES[idType as IdType] : undefined;
  if (!rule) return value.length >= 4 ? null : "Enter a valid ID number.";

  return rule.pattern.test(value) ? null : rule.message;
}

/** Whether the (raw) ID number is valid for its type. */
export function isIdNumberValid(
  idType: string | null | undefined,
  raw: string
): boolean {
  return validateIdNumber(idType, raw) === null;
}

/** Placeholder example for the given type (falls back to a generic hint). */
export function idNumberHint(idType: string | null | undefined): string {
  const rule = idType ? DOCUMENT_RULES[idType as IdType] : undefined;
  return rule?.example ?? "ID number";
}

/** Input `maxLength` cap for the given type. */
export function idNumberMaxLength(idType: string | null | undefined): number {
  const rule = idType ? DOCUMENT_RULES[idType as IdType] : undefined;
  return rule?.maxLength ?? 32;
}
