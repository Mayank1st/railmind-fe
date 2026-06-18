"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Brand marks — lucide deprecated its social/brand icons, so inline them.
const ICON = "h-4 w-4";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const socials = [
  { label: "X", icon: <XIcon /> },
  { label: "Instagram", icon: <InstagramIcon /> },
  { label: "LinkedIn", icon: <LinkedinIcon /> },
  { label: "YouTube", icon: <YoutubeIcon /> },
];

const links = [
  {
    heading: "Product",
    items: [
      { label: "Search Trains", href: "/" },
      { label: "PNR Status", href: "/pnr" },
      { label: "Live Running", href: "/live/12951" },
      { label: "Fare Enquiry", href: "/fare" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "My Bookings", href: "/bookings" },
      { label: "Saved Passengers", href: "/passengers" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "#" },
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Refunds", href: "/legal/refunds" },
      { label: "IRCTC Compliance", href: "/legal/irctc" },
    ],
  },
];

export default function Footer() {
  // Which social tooltip is open (social links aren't live yet → "Coming soon").
  const [openSocial, setOpenSocial] = useState<string | null>(null);

  return (
    <footer className="mt-auto border-t border-white/8 bg-[#0e1210]">
      <div className="app-container py-8">
        {/* Top row — brand on the left, link columns grouped on the right */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand */}
          <div className="flex max-w-[330px] flex-col gap-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/new_logo.png"
                alt="RailMind"
                width={120}
                height={80}
              />
            </Link>
            <Separator className="bg-white/10" />
            <p className="text-sm leading-relaxed text-white/40">
              AI-powered railway reservations. Smarter searches, predictable
              confirmations.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <Tooltip
                  key={s.label}
                  open={openSocial === s.label}
                  onOpenChange={(open) => setOpenSocial(open ? s.label : null)}
                >
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={s.label}
                      onClick={() => setOpenSocial(s.label)}
                      className="hover:border-accent-warm/40 hover:bg-accent-warm/10 hover:text-accent-warm dark:hover:bg-accent-warm/10 h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] text-white/50"
                    >
                      {s.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-4 sm:gap-x-20 xl:gap-x-28">
            {links.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-white/90">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-white/40 transition-colors hover:text-white/70"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <Separator className="mt-8 bg-white/8" />
        <div className="flex flex-col items-start justify-between gap-3 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-white/30">© 2026 RailMind Technologies</p>
          <p className="text-sm text-white/30">
            railmind.app · help@railmind.app
          </p>
        </div>
      </div>
    </footer>
  );
}
