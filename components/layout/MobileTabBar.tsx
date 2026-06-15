"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, ClipboardList, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { label: "Search", href: "/", icon: Search },
  { label: "PNR", href: "/pnr", icon: ClipboardList },
  { label: "Bookings", href: "/bookings", icon: Bookmark },
  { label: "Profile", href: "/profile", icon: User },
];

// Fixed bottom navigation — mobile only (hidden on md+). Pages get bottom
// padding via the layout so content never hides behind it.
// Routes where the app-shell tab bar shouldn't appear — auth + the booking
// action steps, which use their own sticky bottom action bar instead.
const HIDDEN_ON = [
  "/login",
  "/register",
  "/otp",
  "/book/passengers",
  "/book/review",
  "/book/payment",
];

export default function MobileTabBar() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0e1210]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                active ? "text-[#E8AA4D]" : "text-white/50 hover:text-white/80"
              )}
            >
              <tab.icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
