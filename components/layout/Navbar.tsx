"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Ticket,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
) {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

function getDisplayName(firstName?: string | null, email?: string | null) {
  const f = (firstName ?? "").trim();
  if (f) return f;
  if (email) return email.split("@")[0];
  return "Account";
}

function getFullName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
) {
  const composed = [firstName, lastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (composed) return composed;
  return getDisplayName(firstName, email);
}

const navLinks = [
  { label: "Search", href: "/", activePath: "/" },
  { label: "PNR Status", href: "/pnr", activePath: "/pnr" },
  { label: "My Bookings", href: "/bookings", activePath: "/bookings" },
  { label: "Help", href: "/help", activePath: "/help" },
];

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);

  const isActive = (activePath: string) => {
    if (activePath === "/") return pathname === "/";
    if (pathname === activePath || pathname.startsWith(activePath + "/"))
      return true;
    // When redirected to login/register, highlight the intended destination
    if (pathname === "/login" || pathname === "/register") {
      const next = searchParams.get("next") ?? "";
      if (next === activePath || next.startsWith(activePath + "/")) return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // even if backend fails, clear local state
    }
    reset();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b border-white/10 bg-[#121713] font-bold">
      <div className="app-container flex items-center justify-between py-3">
        {/* ── LEFT GROUP: logo + nav links ── */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/new_logo.png"
              alt="RailMind Logo"
              width={100}
              height={50}
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
                  isActive(link.activePath)
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
          <button className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-[#E8AA4D]">
            <span className="h-2 w-2 rounded-full bg-[#E8AA4D]" />
            AI Assistant
          </button>

          {status === "loading" ? (
            <div className="h-9 w-40 animate-pulse rounded-full bg-white/5" />
          ) : status === "authed" && user ? (
            <>
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white"
              >
                <Bell className="h-5 w-5" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 py-1 pr-3 pl-1 text-sm text-white/90 hover:border-white/20 hover:bg-white/[0.03] focus:outline-none"
                  >
                    <Avatar className="size-7">
                      {user.profile_photo && (
                        <AvatarImage
                          src={user.profile_photo}
                          alt={getDisplayName(user.first_name, user.email)}
                        />
                      )}
                      <AvatarFallback className="bg-[#E8AA4D] text-[11px] font-semibold text-[#3d2817]">
                        {getInitials(
                          user.first_name,
                          user.last_name,
                          user.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-normal">
                      {getDisplayName(user.first_name, user.email)}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/50" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-60"
                >
                  <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
                    <span className="text-foreground text-sm font-medium">
                      {getFullName(user.first_name, user.last_name, user.email)}
                    </span>
                    {user.email && (
                      <span className="text-muted-foreground truncate text-xs font-normal">
                        {user.email}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/profile")}>
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/bookings")}>
                    <Ticket />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/passengers")}>
                    <Users />
                    Saved Passengers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={handleLogout}
                  >
                    <LogOut />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-normal text-white/80 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#E8AA4D] px-5 py-2 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
