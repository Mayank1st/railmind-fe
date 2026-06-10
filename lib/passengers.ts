import { api } from "./api";

export type Passenger = {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  id_type: string | null;
  id_number: string | null;
  berth_preference: string;
  is_primary: boolean;
};

export type CreatePassengerPayload = {
  full_name: string;
  age: number;
  gender: string;
  id_type: string;
  id_number: string;
  berth_preference: string;
  is_primary: boolean;
};

// PATCH — every field is optional (partial update).
export type UpdatePassengerPayload = Partial<CreatePassengerPayload>;

export const passengersApi = {
  // Backend wraps payloads as { data: ... }. The list `data` may be the array
  // directly, a paginated wrapper, or null — normalise to an array either way.
  list: () =>
    api.get("/passenger").then((r) => {
      const d = r.data?.data;
      if (Array.isArray(d)) return d as Passenger[];
      if (Array.isArray(d?.passengers)) return d.passengers as Passenger[];
      if (Array.isArray(d?.items)) return d.items as Passenger[];
      if (Array.isArray(d?.results)) return d.results as Passenger[];
      return [] as Passenger[];
    }),

  create: (payload: CreatePassengerPayload) =>
    api
      .post<{ data: Passenger }>("/passenger", payload)
      .then((r) => r.data.data),

  update: (id: string, payload: UpdatePassengerPayload) =>
    api
      .patch<{ data: Passenger }>(`/passenger/${id}`, payload)
      .then((r) => r.data.data),
};

/* ── Shared option lists + label helpers (used by both pages) ── */

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const ID_TYPE_OPTIONS = [
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "PAN", label: "PAN" },
];

export const BERTH_OPTIONS = [
  { value: "NP", label: "No Pref" },
  { value: "LB", label: "Lower" },
  { value: "MB", label: "Middle" },
  { value: "UB", label: "Upper" },
  { value: "SL", label: "Side Lower" },
  { value: "SU", label: "Side Upper" },
];

function labelFor(
  opts: { value: string; label: string }[],
  value?: string | null
) {
  if (!value) return "";
  return opts.find((o) => o.value === value)?.label ?? value;
}

export const genderLabel = (g?: string | null) => labelFor(GENDER_OPTIONS, g);
export const genderShort = (g?: string | null) =>
  (genderLabel(g)?.[0] ?? "").toUpperCase();
export const idTypeLabel = (t?: string | null) => labelFor(ID_TYPE_OPTIONS, t);
export const berthLabel = (b?: string | null) =>
  labelFor(BERTH_OPTIONS, b) || "No Pref";

/** Derives a display tag from the passenger's flags/age. */
export function passengerTag(p: Passenger): string | null {
  if (p.is_primary) return "Primary";
  if (p.age >= 60) return "Senior citizen";
  if (p.age >= 5 && p.age <= 11) return "Child (5-11)";
  return null;
}

/** "Passport · P7654321" or "" if no document on file. */
export function passengerDoc(p: Passenger): string {
  if (!p.id_type && !p.id_number) return "";
  return [idTypeLabel(p.id_type), p.id_number].filter(Boolean).join(" · ");
}
