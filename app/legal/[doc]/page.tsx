"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type LegalDoc = {
  slug: string;
  nav: string;
  title: string;
  updated: string;
  intro: string;
  sections: { title: string; body: string }[];
};

const DOCS: Record<string, LegalDoc> = {
  terms: {
    slug: "terms",
    nav: "Terms",
    title: "Terms of Service",
    updated: "12 May 2026",
    intro:
      "These terms govern your use of RailMind, an AI-powered railway reservation platform operated by RailMind Technologies Pvt. Ltd. By creating an account or booking a ticket, you agree to them.",
    sections: [
      {
        title: "Eligibility & account",
        body: "You must be 18 or older to create an account. You are responsible for keeping your login credentials secure and for all activity under your account. Information you provide — including passenger details and contact information — must be accurate and current.",
      },
      {
        title: "Bookings & e-tickets",
        body: "A booking is confirmed only once payment succeeds and a PNR is issued. E-tickets are valid for travel along with the same photo ID used at the time of booking. Partially confirmed tickets allow only confirmed passengers to travel.",
      },
      {
        title: "AI predictions",
        body: "Confirmation-probability estimates are generated from historical booking patterns and are provided for guidance only. They are not a guarantee of confirmation. RailMind is not liable for decisions made solely on the basis of a prediction.",
      },
      {
        title: "Fares & charges",
        body: "Fares, reservation charges, and applicable service fees are displayed before you pay. RailMind may revise its service fees with notice. Railway-set fares are governed by the railway authority and may change without notice.",
      },
      {
        title: "Conduct",
        body: "You agree not to misuse the platform, including automated scraping, fraudulent bookings, or reselling tickets. Accounts involved in such activity may be suspended.",
      },
      {
        title: "Limitation of liability",
        body: "RailMind acts as a booking facilitator. We are not responsible for train delays, cancellations by the railway, or service disruptions outside our control. Our total liability is limited to the service fees you paid for the affected booking.",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    nav: "Privacy",
    title: "Privacy Policy",
    updated: "12 May 2026",
    intro:
      "This policy explains what data RailMind collects, why, and how we protect it. We collect only what is needed to book your travel and improve the service.",
    sections: [
      {
        title: "What we collect",
        body: "Account details (name, email, mobile), passenger details you save, payment metadata (not full card numbers), and usage data such as searches and bookings. ID documents are collected only when you opt into KYC.",
      },
      {
        title: "How we use it",
        body: "To process bookings, send PNR and journey alerts, power AI confirmation predictions, prevent fraud, and provide support. We do not sell your personal data to third parties.",
      },
      {
        title: "Data sharing",
        body: "Passenger and journey details are shared with the railway reservation system to issue tickets, and with payment gateways to process payments. Both are bound by their own data obligations.",
      },
      {
        title: "Security",
        body: "Sensitive data, including ID numbers, is encrypted at rest and masked throughout the app. Access is restricted and audited. We use TLS for all data in transit.",
      },
      {
        title: "Your rights",
        body: "You can view, edit, or delete your profile and saved passengers at any time from Settings. You may request account deletion, after which we retain only what the law requires for completed bookings.",
      },
      {
        title: "Cookies",
        body: "We use essential cookies for sign-in and a small number of analytics cookies to understand usage. You can manage non-essential cookies from your browser.",
      },
    ],
  },
  refunds: {
    slug: "refunds",
    nav: "Refunds",
    title: "Refund & Cancellation Policy",
    updated: "12 May 2026",
    intro:
      "Cancellation charges follow railway rules and depend on how far before departure you cancel. Exact charges are always shown before you confirm a cancellation.",
    sections: [
      {
        title: "Cancellation windows",
        body: "More than 48 hours before departure: near-full refund, minus a flat cancellation fee. Between 12 and 48 hours: roughly 50% of the fare is refunded. Within 12 hours of departure: confirmed tickets are non-refundable.",
      },
      {
        title: "Waitlisted & RAC tickets",
        body: "Fully waitlisted tickets that do not clear are auto-cancelled and refunded in full, minus minimal charges. RAC tickets follow the standard cancellation windows above.",
      },
      {
        title: "Refund timeline",
        body: "Refunds are initiated immediately on cancellation and reach your original payment method within 3–5 business days. You can track refund status from the booking detail page.",
      },
      {
        title: "Failed payments",
        body: "If a payment is debited but the booking does not complete, the amount is auto-reversed within 3–5 business days. No manual claim is required — funds are held in escrow until the booking succeeds.",
      },
      {
        title: "Train cancellations by railway",
        body: "If the railway cancels a train, eligible tickets are refunded in full automatically, including RailMind service fees for that booking.",
      },
    ],
  },
  irctc: {
    slug: "irctc",
    nav: "IRCTC Compliance",
    title: "IRCTC Compliance",
    updated: "12 May 2026",
    intro:
      "RailMind operates in accordance with Indian Railways and IRCTC norms for online reservation and authorised partner conduct.",
    sections: [
      {
        title: "Authorised booking",
        body: "All reservations are made through authorised railway reservation channels. PNRs are issued by the railway system; RailMind does not generate or alter them.",
      },
      {
        title: "Identity & travel rules",
        body: "Passengers must carry a valid government photo ID matching the booking. The lead passenger of an e-ticket must travel; otherwise the entire ticket may be treated as invalid per railway rules.",
      },
      {
        title: "Tatkal & quota rules",
        body: "Tatkal, Ladies, Senior Citizen, and other quotas are governed by railway policy, including booking windows and per-ticket passenger limits. RailMind enforces these limits at booking time.",
      },
      {
        title: "Charting & berth allotment",
        body: "Final berth allotment and chart preparation are controlled by the railway system, typically 4 hours before departure. RailMind reflects this status but does not influence allotment.",
      },
      {
        title: "Grievance redressal",
        body: "Booking and refund grievances are handled per railway timelines. Unresolved issues may be escalated to the railway's official grievance channels. Contact help@railmind.app to begin.",
      },
    ],
  },
};

const ORDER = ["terms", "privacy", "refunds", "irctc"];
const FOOTER_NOTE =
  "This is a product-design document for the RailMind concept and is not legal advice. RailMind | AI-Powered Railway Reservation System | railmind.app";

export default function LegalPage() {
  const params = useParams();
  const slug = String(params.doc ?? "terms");
  const doc = DOCS[slug] ?? DOCS.terms;

  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      {/* Warm wash behind the header */}
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,#281506_0%,#1a1a18_100%)]" />

      <div className="app-container relative z-10 pb-20">
        {/* ── Header ── */}
        <header className="pt-10 pb-8 sm:pt-14">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase">
            Legal Center
          </p>
          <h1 className="font-heading text-foreground mt-2 text-4xl font-normal tracking-[-0.5px] sm:text-5xl">
            Policies &amp; terms
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base">
            The rules, protections, and commitments behind every RailMind
            booking.
          </p>
        </header>

        <div className="border-t border-white/8 pt-8 sm:pt-10">
          {/* ── Mobile: tab chips ── */}
          <div className="-mx-[var(--app-gutter)] mb-8 flex gap-2 overflow-x-auto px-[var(--app-gutter)] pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            {ORDER.map((s) => {
              const active = s === doc.slug;
              return (
                <Link
                  key={s}
                  href={`/legal/${s}`}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-[#E8AA4D] text-[#3d2817]"
                      : "text-foreground/70 bg-[#252523] hover:bg-[#2f2f2d]"
                  )}
                >
                  {DOCS[s].nav}
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <p className="text-foreground mb-3 text-sm font-semibold">
                  Legal
                </p>
                <nav className="space-y-1">
                  {ORDER.map((s) => {
                    const active = s === doc.slug;
                    return (
                      <Link
                        key={s}
                        href={`/legal/${s}`}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-[#33240f] font-medium text-[#E8AA4D]"
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                      >
                        {DOCS[s].nav}
                        {active && <ChevronRight className="h-4 w-4" />}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-muted-foreground text-sm">
                    Questions about these terms?
                  </p>
                  <a
                    href="mailto:help@railmind.app"
                    className="text-accent-warm mt-1 inline-block text-sm hover:underline"
                  >
                    help@railmind.app
                  </a>
                </div>
              </div>
            </aside>

            {/* ── Content ── */}
            <article className="min-w-0">
              <h2 className="font-heading text-foreground text-3xl sm:text-4xl">
                {doc.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Last updated {doc.updated}
              </p>

              <p className="text-foreground/70 mt-6 text-[15px] leading-relaxed sm:text-base">
                {doc.intro}
              </p>

              <div className="my-8 border-t border-white/8" />

              <div className="space-y-8">
                {doc.sections.map((s, i) => (
                  <section key={s.title}>
                    <h3 className="text-foreground text-lg font-semibold">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="text-foreground/60 mt-2 text-[15px] leading-relaxed sm:text-base">
                      {s.body}
                    </p>
                  </section>
                ))}
              </div>

              {/* Footer note */}
              <div className="mt-10 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {FOOTER_NOTE}
                </p>
              </div>

              {/* Mobile: contact */}
              <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 lg:hidden">
                <p className="text-muted-foreground text-sm">
                  Questions?{" "}
                  <a
                    href="mailto:help@railmind.app"
                    className="text-accent-warm hover:underline"
                  >
                    help@railmind.app
                  </a>
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
