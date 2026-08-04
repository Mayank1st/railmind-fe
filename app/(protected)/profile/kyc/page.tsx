"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { toApiError } from "@/lib/api";
import { normalizeIdNumber } from "@/lib/document";
import {
  displayDateToIso,
  EMPTY_KYC_FORM,
  isoToDisplayDate,
  KYC_DOCUMENT_OPTIONS,
  KYC_ERROR,
  KYC_FIELD_META,
  KYC_GENDER_OPTIONS,
  KYC_MAX_BYTES,
  kycNumberField,
  kycSizeRejection,
  kycStatusLabel,
  maskIdNumber,
  parseRetryAfterSeconds,
  prepareKycImage,
  splitFullName,
  validateKycFileType,
  validateKycForm,
  type KycDocumentType,
  type KycExtraction,
  type KycFieldName,
  type KycFileRejection,
  type KycFormErrors,
  type KycFormValues,
} from "@/lib/kyc";
import type { UpdateProfilePayload } from "@/lib/profile";
import { useProfile } from "@/hooks/useProfile";
import { useKycExtractMutation } from "@/hooks/useKycExtractMutation";
import { useSubmitKycMutation } from "@/hooks/useSubmitKycMutation";
import { KycBlockedCard } from "@/components/kyc/KycBlockedCard";
import { KycCaptureStep } from "@/components/kyc/KycCaptureStep";
import { KycConfirmStep } from "@/components/kyc/KycConfirmStep";
import { KycReadingStep } from "@/components/kyc/KycReadingStep";
import { KycSubmittedStep } from "@/components/kyc/KycSubmittedStep";
import { KycWizardShell } from "@/components/kyc/KycWizardShell";

/** Back to the tab the user came from, not the profile's default tab. */
const PROFILE_HREF = "/profile?tab=kyc";

type Stage = "capture" | "reading" | "confirm" | "submitted";

/** Where the reader is out of reach — RM-KYC-004 or the 5/min limit. */
type Blocker = {
  kind: "unavailable" | "rate-limited";
  retryAfterSeconds: number | null;
  /** Remounts the card so a fresh wait restarts its countdown. */
  at: number;
};

type SubmittedSnapshot = {
  documentType: KycDocumentType;
  maskedNumber: string;
  details: { label: string; value: string }[];
  at: Date;
};

function documentLabel(documentType: KycDocumentType) {
  return (
    KYC_DOCUMENT_OPTIONS.find((o) => o.value === documentType)?.label ??
    documentType
  );
}

function isDocumentType(value: string | null): value is KycDocumentType {
  return KYC_DOCUMENT_OPTIONS.some((o) => o.value === value);
}

/** Turns an extraction into the form's string values. */
function formValuesFrom(extraction: KycExtraction): KycFormValues {
  const { fields } = extraction;
  return {
    name: fields.name ?? "",
    date_of_birth: isoToDisplayDate(fields.date_of_birth),
    aadhaar_number: fields.aadhaar_number ?? "",
    gender: fields.gender ?? "",
    pan_number: fields.pan_number ?? "",
    father_name: fields.father_name ?? "",
  };
}

export default function KycVerificationPage() {
  const { data: profile } = useProfile();
  const searchParams = useSearchParams();
  const extract = useKycExtractMutation();
  const submit = useSubmitKycMutation();

  /**
   * `?document=PAN` — the profile's Replace / Upload links say which document
   * the user came for. It preselects that type and is the only way to re-submit
   * one that is already on the account.
   */
  const documentParam = searchParams.get("document");
  const replaceTarget = isDocumentType(documentParam) ? documentParam : null;

  const [pickedType, setPickedType] = useState<KycDocumentType | null>(null);
  const [stage, setStage] = useState<Stage>("capture");
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [rejection, setRejection] = useState<KycFileRejection | null>(null);
  const [readFailure, setReadFailure] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [extraction, setExtraction] = useState<KycExtraction | null>(null);
  const [values, setValues] = useState<KycFormValues>(EMPTY_KYC_FORM);
  const [initialValues, setInitialValues] =
    useState<KycFormValues>(EMPTY_KYC_FORM);
  const [errors, setErrors] = useState<KycFormErrors>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedSnapshot | null>(null);

  /* ── Which document types are still open ──
   * A document already on the account is locked, so a user who came to add
   * Aadhaar cannot accidentally re-submit the PAN that is already under review.
   * The Replace link unlocks its own type — and if every type is already linked
   * we lock nothing, or there would be nothing left to do on this screen.
   */
  const linked: Record<KycDocumentType, boolean> = {
    AADHAAR: Boolean(profile?.adhaar_number),
    PAN: Boolean(profile?.pan_number),
  };
  const candidateLocks = KYC_DOCUMENT_OPTIONS.filter(
    (o) => linked[o.value] && o.value !== replaceTarget
  ).map((o) => o.value);
  const lockedTypes =
    candidateLocks.length === KYC_DOCUMENT_OPTIONS.length ? [] : candidateLocks;

  const firstOpenType =
    KYC_DOCUMENT_OPTIONS.find((o) => !lockedTypes.includes(o.value))?.value ??
    "AADHAAR";
  // Derived, not stored: the profile arrives after the first render, so a locked
  // type must be able to fall away without a state-syncing effect.
  const documentType: KycDocumentType =
    pickedType && !lockedTypes.includes(pickedType)
      ? pickedType
      : (replaceTarget ?? firstOpenType);

  const optionStates: Partial<
    Record<KycDocumentType, { disabled: boolean; note: string }>
  > = {};
  for (const option of KYC_DOCUMENT_OPTIONS) {
    if (!linked[option.value]) continue;
    const status = kycStatusLabel(profile?.kyc_status);
    optionStates[option.value] = lockedTypes.includes(option.value)
      ? { disabled: true, note: `${status} — replace it from your profile` }
      : { disabled: false, note: "Replacing the document you already added" };
  }

  /** The photo actually sent — kept so "Try again" doesn't ask for it twice. */
  const preparedFileRef = useRef<File | null>(null);
  const pickedSizeRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  // Object URLs outlive the component unless we hand them back.
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      abortRef.current?.abort();
    },
    []
  );

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function runExtraction(file: File) {
    setStage("reading");
    setUploadPercent(0);
    setBlocker(null);

    const controller = new AbortController();
    abortRef.current = controller;
    cancelledRef.current = false;

    try {
      const result = await extract.mutateAsync({
        document: file,
        document_type: documentType,
        onUploadProgress: setUploadPercent,
        signal: controller.signal,
      });
      applyExtraction(result);
    } catch (error) {
      if (cancelledRef.current) return; // the user pressed Cancel
      handleExtractError(error);
    } finally {
      abortRef.current = null;
    }
  }

  function applyExtraction(result: KycExtraction) {
    const next = formValuesFrom(result);
    setExtraction(result);
    // Trust the server's echo over our local pick.
    setPickedType(result.document_type);
    setValues(next);
    setInitialValues(next);
    setErrors({});
    setConfirmed(false);
    setSubmitError(null);
    setReadFailure(null);
    setStage("confirm");
  }

  function handleExtractError(error: unknown) {
    const { code, message } = toApiError(error);

    switch (code) {
      // Expected in the wild: the reader will not guess a digit. Keep the
      // camera open and say why, without blaming the user.
      case KYC_ERROR.NUMBER_UNREADABLE:
        setReadFailure(message);
        setStage("capture");
        return;

      case KYC_ERROR.VISION_FAILED:
        setBlocker({
          kind: "unavailable",
          retryAfterSeconds: null,
          at: Date.now(),
        });
        setStage("capture");
        return;

      case KYC_ERROR.RATE_LIMITED:
        setBlocker({
          kind: "rate-limited",
          retryAfterSeconds: parseRetryAfterSeconds(message),
          at: Date.now(),
        });
        setStage("capture");
        return;

      case KYC_ERROR.FILE_TOO_LARGE:
        setRejection(kycSizeRejection(pickedSizeRef.current || KYC_MAX_BYTES));
        setStage("capture");
        return;

      case KYC_ERROR.UNSUPPORTED_TYPE:
        setRejection({
          title: "That file type cannot be read",
          detail: "Please upload a JPEG, PNG or WebP photo of the card.",
        });
        setStage("capture");
        return;

      case KYC_ERROR.UNDECODABLE:
        setRejection({
          title: "That file is damaged",
          detail: "We could not open that image. Please take the photo again.",
        });
        setStage("capture");
        return;

      default:
        // RM-AUTH-019 (401) never lands here — the shared client redirects to
        // login before we see it.
        setRejection({
          title: "We could not read that photo",
          detail: message,
        });
        setStage("capture");
    }
  }

  async function handlePickFile(file: File) {
    setRejection(null);
    setReadFailure(null);
    setBlocker(null);
    pickedSizeRef.current = file.size;

    const typeRejection = validateKycFileType(file);
    if (typeRejection) {
      setRejection(typeRejection);
      return;
    }

    setPreparing(true);
    let prepared: File;
    try {
      prepared = await prepareKycImage(file);
    } finally {
      setPreparing(false);
    }

    // Only a genuinely un-shrinkable photo reaches this.
    if (prepared.size > KYC_MAX_BYTES) {
      setRejection(kycSizeRejection(file.size));
      return;
    }

    preparedFileRef.current = prepared;
    setPreview(URL.createObjectURL(prepared));
    await runExtraction(prepared);
  }

  function handleCancelReading() {
    cancelledRef.current = true;
    abortRef.current?.abort();
    // The photo was uploaded before the read started, so it may already be
    // stored server-side. That is expected — there is no cleanup call.
    setStage("capture");
  }

  function handleRetry() {
    setBlocker(null);
    const file = preparedFileRef.current;
    if (file) {
      void runExtraction(file);
    } else {
      setStage("capture");
    }
  }

  /**
   * Manual entry — same admin review, and whatever was already read or typed
   * stays in the form.
   */
  function handleManualEntry() {
    setExtraction(null);
    setInitialValues(EMPTY_KYC_FORM);
    setBlocker(null);
    setRejection(null);
    setReadFailure(null);
    setErrors({});
    setConfirmed(false);
    setSubmitError(null);
    setStage("confirm");
  }

  function handleRetake() {
    setConfirmed(false);
    setSubmitError(null);
    setStage("capture");
  }

  function handleReplaceDocument() {
    setExtraction(null);
    setValues(EMPTY_KYC_FORM);
    setInitialValues(EMPTY_KYC_FORM);
    setErrors({});
    setConfirmed(false);
    setSubmitError(null);
    setSubmitted(null);
    setRejection(null);
    setReadFailure(null);
    setBlocker(null);
    preparedFileRef.current = null;
    setPreview(null);
    setStage("capture");
  }

  function handleFieldChange(field: KycFieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit() {
    const nextErrors = validateKycForm(documentType, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);

    const rawNumber = normalizeIdNumber(values[kycNumberField(documentType)]);
    const payload: UpdateProfilePayload =
      documentType === "AADHAAR"
        ? { aadhaar_number: rawNumber }
        : { pan_number: rawNumber };

    // The ID number is the KYC block; name / DOB / gender are ordinary profile
    // fields and only ride along when the user actually corrected them.
    const iso = displayDateToIso(values.date_of_birth);
    if (iso && iso !== profile?.date_of_birth) {
      payload.date_of_birth = iso;
    }
    if (
      documentType === "AADHAAR" &&
      values.gender &&
      values.gender !== profile?.gender
    ) {
      payload.gender = values.gender;
    }
    const printedName = values.name.trim();
    const profileName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (printedName && printedName !== profileName) {
      Object.assign(payload, splitFullName(printedName));
    }

    try {
      const result = await submit.mutateAsync(payload);

      // Prefer the backend's own masking, but only if it really is masked —
      // this screen must never print a full government ID, whatever comes back.
      const echoed =
        documentType === "AADHAAR"
          ? (result.aadhaar_number ?? result.adhaar_number)
          : result.pan_number;
      const echoedIsMasked = Boolean(echoed && /X/i.test(echoed));

      const genderLabel = KYC_GENDER_OPTIONS.find(
        (o) => o.value === values.gender
      )?.label;

      setSubmitted({
        documentType,
        maskedNumber:
          echoedIsMasked && echoed ? echoed : maskIdNumber(rawNumber),
        details: [
          { label: "Name", value: printedName || "—" },
          { label: "Date of birth", value: values.date_of_birth },
          ...(documentType === "AADHAAR" && genderLabel
            ? [{ label: "Gender", value: genderLabel }]
            : []),
        ],
        at: new Date(),
      });
      setStage("submitted");
    } catch (error) {
      // RM-AUTH-006 (409) = already linked to another account. Backend messages
      // on this endpoint are user-facing.
      setSubmitError(toApiError(error).message);
    }
  }

  const label = documentLabel(documentType);
  const step = stage === "submitted" ? 3 : stage === "confirm" ? 2 : 1;

  return (
    <KycWizardShell step={step} backHref={PROFILE_HREF}>
      {stage === "reading" ? (
        <KycReadingStep
          documentLabel={label}
          previewUrl={previewUrl}
          uploadPercent={uploadPercent}
          onCancel={handleCancelReading}
        />
      ) : stage === "confirm" ? (
        <KycConfirmStep
          documentType={documentType}
          documentLabel={label}
          values={values}
          initialValues={initialValues}
          errors={errors}
          onChange={handleFieldChange}
          fromPhoto={Boolean(extraction)}
          unreadableFields={extraction?.unreadable_fields ?? []}
          previewUrl={previewUrl}
          onRetake={handleRetake}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          onSubmit={handleSubmit}
          submitting={submit.isPending}
          submitError={submitError}
        />
      ) : stage === "submitted" && submitted ? (
        <KycSubmittedStep
          documentLabel={documentLabel(submitted.documentType)}
          numberLabel={
            KYC_FIELD_META[kycNumberField(submitted.documentType)].label
          }
          maskedNumber={submitted.maskedNumber}
          details={submitted.details}
          submittedAt={submitted.at}
          onReplace={handleReplaceDocument}
          backHref={PROFILE_HREF}
        />
      ) : blocker ? (
        <KycBlockedCard
          key={`${blocker.kind}-${blocker.at}`}
          title={
            blocker.kind === "rate-limited"
              ? "Too many attempts"
              : "We could not check your card just now"
          }
          description={
            blocker.kind === "rate-limited"
              ? "For safety we allow five document checks a minute, and that limit has just been reached. On a shared office or campus network somebody else may have used them. Your earlier photos were not saved."
              : "The document checker is temporarily unavailable. Nothing was saved, and no attempt has been counted against you."
          }
          retryAfterSeconds={blocker.retryAfterSeconds}
          onRetry={handleRetry}
          onManualEntry={handleManualEntry}
        />
      ) : (
        <KycCaptureStep
          documentType={documentType}
          onDocumentTypeChange={setPickedType}
          optionStates={optionStates}
          onPickFile={handlePickFile}
          onManualEntry={handleManualEntry}
          rejection={rejection}
          readFailure={readFailure}
          busy={preparing}
        />
      )}
    </KycWizardShell>
  );
}
