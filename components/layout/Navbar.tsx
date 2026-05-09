"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Search", href: "/" },
  { label: "PNR Status", href: "/pnr" },
  { label: "My Bookings", href: "/bookings" },
  { label: "Help", href: "/help" },
];

// bg-[#1a1a18]

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-white/10 bg-[#00000] px-8 py-3 font-bold">
      {/* ── LEFT GROUP: logo + nav links ── */}
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="RailMind Logo"
            width={80}
            height={40}
            priority
          />
          {/* <div className="flex flex-col leading-none">
            <span className="font-heading text-sm font-bold tracking-widest text-white">
              RAIL
            </span>
            <span className="font-heading text-sm font-bold tracking-widest text-emerald-400">
              MIND
            </span>
          </div> */}
        </Link>

        {/* ── NAV LINKS — next to logo ── */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "rounded-lg bg-[#e8dcc8] px-5 py-2 text-sm font-medium text-[#3d2817]"
                  : "rounded-lg px-5 py-2 text-sm font-normal text-white/60 hover:text-white"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 rounded-full border border-white/15 bg-[#00000] px-4 py-1.5 text-sm text-[#ac6a0a]">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          AI Assistant
        </button>

        <Link
          href="/login"
          className="text-sm font-normal text-white/80 hover:text-white"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}
