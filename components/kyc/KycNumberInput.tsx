"use client";

import { useLayoutEffect, useRef } from "react";

import {
  formatKycNumber,
  kycNumberMaxLength,
  sanitizeKycNumber,
  type KycDocumentType,
} from "@/lib/kyc";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface KycNumberInputProps {
  id: string;
  documentType: KycDocumentType;
  /** The stored value — separator-free, exactly what gets submitted. */
  value: string;
  onChange: (raw: string) => void;
  invalid: boolean;
  placeholder: string;
  describedBy?: string;
}

/**
 * The ID-number field. Aadhaar is displayed grouped ("9876 5432 1098") because
 * proof-reading twelve digits is the entire point of this screen, but only the
 * separator-free value is ever stored or submitted — re-adding spaces on the way
 * back changes the stored value and breaks server-side duplicate detection.
 *
 * Because the display is a formatted view of the raw value, the caret is
 * restored by significant-character position after each keystroke, so editing a
 * digit in the middle doesn't jump the cursor to the end.
 */
export function KycNumberInput({
  id,
  documentType,
  value,
  onChange,
  invalid,
  placeholder,
  describedBy,
}: KycNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** Significant chars that should sit before the caret after the re-render. */
  const caretTargetRef = useRef<number | null>(null);

  const display = formatKycNumber(documentType, value);

  useLayoutEffect(() => {
    const target = caretTargetRef.current;
    const el = inputRef.current;
    caretTargetRef.current = null;
    if (target === null || !el) return;

    // Walk the formatted string until `target` significant chars have passed.
    let seen = 0;
    let index = display.length;
    for (let i = 0; i < display.length; i += 1) {
      if (seen >= target) {
        index = i;
        break;
      }
      if (display[i] !== " ") seen += 1;
    }
    if (seen < target) index = display.length;

    el.setSelectionRange(index, index);
  }, [display]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const typed = event.target.value;
    const caret = event.target.selectionStart ?? typed.length;
    caretTargetRef.current = sanitizeKycNumber(
      documentType,
      typed.slice(0, caret)
    ).length;
    onChange(sanitizeKycNumber(documentType, typed));
  }

  return (
    <Input
      ref={inputRef}
      id={id}
      value={display}
      onChange={handleChange}
      inputMode={documentType === "AADHAAR" ? "numeric" : "text"}
      autoComplete="off"
      spellCheck={false}
      maxLength={kycNumberMaxLength(documentType)}
      placeholder={placeholder}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={cn(
        "h-11 rounded-lg border-white/12 bg-white/[0.02] font-mono text-[15px] tracking-wide",
        invalid && "border-red-500/50 bg-red-500/[0.06]"
      )}
    />
  );
}
