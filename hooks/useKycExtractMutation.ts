import { useMutation } from "@tanstack/react-query";

import { kycApi, type KycExtractPayload } from "@/lib/kyc";

/**
 * Reads an Aadhaar / PAN photo. Nothing is saved by this call — the result is
 * shown to the user for confirmation first.
 *
 * `retry: false` on purpose: the endpoint is rate-limited to 5/min per IP, so a
 * silent retry would burn an attempt the user still needs. RM-KYC-004 is
 * retried explicitly by the user instead.
 */
export function useKycExtractMutation() {
  return useMutation({
    mutationFn: (payload: KycExtractPayload) => kycApi.extract(payload),
    retry: false,
  });
}
