"use client";

import SearchForm from "@/components/train/SearchForm";
import Link from "next/link";
import { ClipboardList, Clock, Receipt, Bookmark } from "lucide-react";

const quickLinks = [
  {
    icon: ClipboardList,
    title: "PNR Status",
    subtitle: "Track confirmation",
    href: "/pnr",
  },
  {
    icon: Clock,
    title: "Live Running",
    subtitle: "Where is my train",
    href: "#",
  },
  {
    icon: Receipt,
    title: "Fare Enquiry",
    subtitle: "Class-wise breakup",
    href: "#",
  },
  {
    icon: Bookmark,
    title: "My Bookings",
    subtitle: "Manage trips",
    href: "/bookings",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      {/* Background gradient — cream wash fading to dark */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f6eada_0%,#1a1a18_75%)]" />

      {/* Content — gradient ke upar */}
      <div className="relative z-10">
        {/* Badge */}
        <div className="flex px-16 pt-16">
          <span className="border-accent-warm/30 text-accent-warm flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
            <span className="bg-accent-warm h-2 w-2 rounded-full" />
            AI-powered confirmation predictions
          </span>
        </div>

        {/* Heading */}
        <div className="px-16 pt-8">
          <h1 className="text-foreground text-[64px] leading-[1.05] font-normal tracking-[-1.28px]">
            Book your train, with a <br />
            little less{" "}
            <span className="text-accent-warm italic">uncertainty.</span>
          </h1>

          {/* Subtext */}
          <p className="text-foreground/50 mt-6 max-w-lg text-[17px]">
            Search 13,000+ trains across India. We&apos;ll predict your waitlist
            confirmation chance before you book.
          </p>
        </div>
        {/* Search Form*/}
        <div className="px-16">
          <SearchForm />

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1e1e1c] px-5 py-4 hover:border-white/20"
              >
                <div className="bg-accent-warm/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <link.icon className="text-accent-warm h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {link.title}
                  </p>
                  <p className="text-xs text-white/40">{link.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
