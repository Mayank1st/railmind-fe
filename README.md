# RailMind FE

> AI-Powered Railway Reservation System — Frontend  
> Built with Next.js 15, shadcn/ui, Tailwind CSS, TypeScript

---

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | Next.js 15 (App Router)         |
| Language         | TypeScript                      |
| UI Components    | shadcn/ui (Radix + Nova preset) |
| Styling          | Tailwind CSS v4                 |
| Icons            | Lucide React                    |
| Font             | Geist                           |
| State Management | Zustand                         |
| Server State     | TanStack Query                  |
| Forms            | react-hook-form + Zod           |
| HTTP Client      | Axios                           |
| Code Quality     | ESLint + Prettier + Husky       |

---

## Project Structure

```
railmind-fe/
├── app/
│   ├── (auth)/                 # Public auth pages — no guard
│   │   ├── login/
│   │   ├── register/
│   │   └── otp/
│   ├── (protected)/            # Auth required — redirects to /login
│   │   ├── bookings/
│   │   │   └── [id]/
│   │   │       └── receipt/
│   │   ├── passengers/
│   │   └── profile/
│   ├── trains/                 # Public train pages
│   │   ├── search/
│   │   └── [trainNumber]/
│   │       ├── schedule/
│   │       └── seat-availability/
│   ├── pnr/
│   │   └── [pnr]/              # Public PNR lookup
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Homepage — Train Search
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Navbar, Footer, Sidebar
│   ├── auth/                   # Login, Register, OTP forms
│   ├── train/                  # SearchForm, TrainCard, Schedule
│   ├── booking/                # BookingForm, BookingCard, FareSummary
│   └── shared/                 # LoadingSpinner, ErrorMessage, EmptyState
│
├── lib/
│   ├── api.ts                  # Axios instance with interceptors
│   ├── auth.ts                 # Token/session helpers
│   └── utils.ts                # Shared utilities
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTrainSearch.ts
│   └── useBooking.ts
│
├── types/
│   ├── auth.ts
│   ├── train.ts
│   ├── booking.ts
│   └── passenger.ts
│
├── store/
│   └── authStore.ts            # Zustand global auth state
│
└── .vscode/
    ├── settings.json           # Format on save, ESLint fix on save
    └── extensions.json         # Recommended extensions
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- RailMind Backend running on `http://localhost:8000`

### Installation

```bash
# Clone the repo
git clone https://github.com/Mayank1st/railmind-fe.git
cd railmind-fe

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Routes

All API calls go to the RailMind FastAPI backend.

| Frontend Route   | Backend Endpoint             |
| ---------------- | ---------------------------- |
| `/login`         | `POST /api/v1/auth/login`    |
| `/register`      | `POST /api/v1/auth/register` |
| `/trains/search` | `GET /api/v1/trains/search`  |
| `/bookings`      | `GET /api/v1/bookings`       |
| `/pnr/[pnr]`     | `GET /api/v1/pnr/{pnr}`      |

---

## Development Workflow

```bash
# Start dev server
npm run dev

# Format code
npm run format

# Lint
npm run lint

# Build for production
npm run build
```

Pre-commit hook automatically runs Prettier + ESLint on every commit.

---

## Related

- [RailMind Backend](https://github.com/Mayank1st/railmind-be) — FastAPI backend
- [RailMind PRD](./docs/PRD.md) — Product Requirements Document

---

## Folder Structure Command

```bash
find . -not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*' | sort
```
