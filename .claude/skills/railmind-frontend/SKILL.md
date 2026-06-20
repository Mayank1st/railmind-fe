---
name: railmind-frontend
description: RailMind frontend conventions — Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, and Zustand. Covers folder/file naming, components, data-fetching hooks, the API layer, types, design tokens, and state. Use whenever writing or editing any frontend code (.ts / .tsx) in the RailMind web app.
---

# RailMind frontend conventions

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS · TanStack Query · Zustand**.
Follow these whenever you write or edit frontend code. Write compliant code from the start.

> ⚠️ This repo runs a **breaking-changes** version of Next.js (see `AGENTS.md`). Before
> writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — APIs,
> conventions, and file structure may differ from training data. These conventions are
> additive to that.

## 1. Folders and files

- **Next.js App Router special files are lowercase:** `page.tsx`, `layout.tsx`,
  `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`. Dynamic segments use
  brackets: `trains/[train_number]/page.tsx`.
- **Component files are `PascalCase`** and match the component name ->
  `TrainCard.tsx`, `SearchForm.tsx`, `Navbar.tsx`. (Exception: vendored shadcn/ui
  primitives under `components/ui/` keep their lowercase upstream names.)
- **Hook files are `useXxx.ts`** (camelCase, `use` prefix) -> `useTrainSearch.ts`.
- **lib / API modules are lowercase** -> `lib/train.ts`, `lib/station.ts`.
- **Always import via the `@/` path alias**, never long relative chains
  (`../../../lib/train`). -> `import { trainSearchApi } from "@/lib/train"`.

Recommended top-level layout:

```
app/            # routes (App Router)
components/      # reusable UI (PascalCase files)
hooks/          # TanStack Query + custom hooks
lib/            # API clients, helpers, query client
store/          # Zustand stores
types/          # shared TS types
```

## 2. Components

- Function components, `PascalCase` name and file.
- **One component per file.** Prefer **named exports** for components; Next.js
  route files (`page.tsx`, `layout.tsx`) must use a **default export**.
- **Props interface is `<Component>Props`** -> `interface TrainCardProps { ... }`.
- Client components start with `"use client"` as the very first line; keep
  components server-side by default unless they need state/effects/browser APIs.
- No business/fetching logic inline in JSX — call a hook (Section 3).

```tsx
"use client";

import { cn } from "@/lib/utils";

interface TrainCardProps {
  train: TrainSummary;
  onBook: (trainNumber: string) => void;
}

export function TrainCard({ train, onBook }: TrainCardProps) {
  return <div className={cn("rounded-xl p-4")}>...</div>;
}
```

## 3. Data fetching — TanStack Query hooks

- **One hook per query, named `useXxx`** -> `useTrainSearch`, `usePnrStatus`.
  Mutations are named `useXxxMutation` -> `useCancelBookingMutation`.
- **Query keys are arrays, namespaced** `["domain", "action", ...params]` ->
  `["trains", "search", payload]`, `["seat-availability", trainNumber, date]`.
- **Always set an explicit `staleTime`** (with a short comment on why) and use
  `enabled` to guard dependent/conditional queries.
- The hook only calls the API layer (Section 4) — never `fetch`/`axios` directly.

```ts
import { useQuery } from "@tanstack/react-query";

import { trainSearchApi, type TrainSearchPayload } from "@/lib/train";

export function useTrainSearch(payload: TrainSearchPayload | null) {
  return useQuery({
    queryKey: ["trains", "search", payload],
    queryFn: () => trainSearchApi.trainSearch(payload!),
    enabled: !!payload,
    staleTime: 5 * 60 * 1000, // 5 min — search results stay fresh briefly
  });
}
```

## 4. API layer (`lib/`)

- Each domain exports a single `camelCase` API object: `trainSearchApi`,
  `stationApi`, `bookingApi`. Methods are verbs -> `getSeatAvailability`,
  `trainSearch`, `getAll`.
- All requests go through one shared HTTP client (base URL, auth cookie,
  interceptors configured once) — do not create ad-hoc clients per call.
- **API field names stay `snake_case`** to match the FastAPI backend
  (`station_code`, `train_number`, `booking_status`). Do not rename them to
  camelCase on the way in. Local-only variables you create are `camelCase`.
- Every method has a typed payload and a typed return.

## 5. Types

- `PascalCase` type/interface names -> `TrainSearchPayload`, `BookingResponse`,
  `TrainSummary`.
- **Import types with the `type` keyword**:
  `import { trainSearchApi, type TrainSearchPayload } from "@/lib/train"`.
- Types mirror the backend response shape (snake_case fields). Keep them in
  `types/` or colocated next to the API module that owns them.
- **No `any`.** Use `unknown` + narrowing if a type is genuinely unknown.

## 6. Styling (Tailwind + design tokens)

- Tailwind utility classes for layout/spacing. Compose conditional classes with
  a `cn()` helper, not string concatenation.
- **Use design tokens — never hardcode raw hex in components.** Tokens:
  - Background `#1a1a18`, cards/surfaces `#1e1e1c`
  - Warm amber accent via `--accent-warm`
  - Headings: serif (`font-heading`). UI text: sans.
- Define colors/fonts once in the Tailwind theme / CSS variables and reference
  them by token name everywhere.
- Every data-driven view handles three states explicitly: **loading**,
  **error**, and **empty** — not just the success path.

## 7. State (Zustand)

- Stores are named `useXxxStore` and live in `store/` -> `useAuthStore`.
- Keep server data in TanStack Query; use Zustand only for client/UI/auth state.
- Auth is exposed through `AuthProvider` backed by the store; read auth via the
  store hook, don't prop-drill the user.

## 8. General (prod-level)

- **TypeScript strict mode on**; fix type errors, never `@ts-ignore` to silence.
- Named exports preferred everywhere except Next.js route files.
- Client-exposed env vars are prefixed `NEXT_PUBLIC_`; secrets never reach the client.
- No `console.log` left in committed code.
- Keep components small; extract logic into hooks and helpers.

## Naming quick reference

| Element               | Convention                 | Example                         |
| --------------------- | -------------------------- | ------------------------------- |
| Route file            | lowercase (Next special)   | `page.tsx`, `layout.tsx`        |
| Dynamic segment       | `[param]`                  | `trains/[train_number]`         |
| Component file + name | PascalCase                 | `TrainCard.tsx`                 |
| Props interface       | `<Component>Props`         | `TrainCardProps`                |
| Hook                  | `useXxx`                   | `useTrainSearch`                |
| Mutation hook         | `useXxxMutation`           | `useCancelBookingMutation`      |
| API module file       | lowercase                  | `lib/train.ts`                  |
| API object            | `camelCase` + `Api`        | `trainSearchApi`                |
| Type / interface      | PascalCase                 | `TrainSearchPayload`            |
| Zustand store         | `useXxxStore`              | `useAuthStore`                  |
| Query key             | array, namespaced          | `["trains", "search", payload]` |
| API field names       | snake_case (match backend) | `station_code`                  |
| Local variables       | camelCase                  | `trainNumber`                   |
