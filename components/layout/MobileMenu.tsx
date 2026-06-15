"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  ClipboardList,
  Clock,
  CreditCard,
  Info,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menu = [
  { label: "Search Trains", href: "/", icon: Search },
  { label: "PNR Status", href: "/pnr", icon: ClipboardList },
  { label: "Live Running", href: "#", icon: Clock },
  { label: "Fare Enquiry", href: "#", icon: CreditCard },
  { label: "My Bookings", href: "/bookings", icon: Bookmark },
  { label: "Saved Passengers", href: "/passengers", icon: User },
  { label: "Profile & Settings", href: "/profile", icon: Settings },
  { label: "Help & Support", href: "/help", icon: Info },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);
  const authed = status === "authed";

  // Build the display name + avatar initials from whatever the profile has.
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = fullName || user?.email?.split("@")[0] || "Account";
  const initials = (
    fullName
      ? fullName
          .split(/\s+/)
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
      : (user?.email?.[0] ?? "U")
  ).toUpperCase();

  const isActive = (href: string) =>
    href !== "#" &&
    (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // clear local state even if the backend call fails
    }
    reset();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="h-9 w-9 rounded-lg text-white/80 hover:bg-white/5 hover:text-white dark:hover:bg-white/5"
        >
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[82%] gap-0 bg-[#0e1210] p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-white/8 p-4">
          <SheetTitle asChild>
            <Link href="/" className="inline-flex">
              <Image
                src="/images/new_logo.png"
                alt="RailMind"
                width={96}
                height={48}
                priority
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        {authed && user && (
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8AA4D] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          {menu.map((item) => {
            const active = isActive(item.href);
            return (
              <SheetClose asChild key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white transition-colors",
                    active ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <item.icon className="size-[18px] text-white/70" />
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <SheetFooter className="border-t border-white/8 p-4">
          {authed ? (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-auto w-full rounded-xl border border-white/15 bg-transparent py-3 text-sm font-normal text-white hover:border-white/25 hover:bg-white/5 hover:text-white dark:bg-transparent dark:hover:bg-white/5"
            >
              Sign out
            </Button>
          ) : (
            <>
              <SheetClose asChild>
                <Button
                  asChild
                  className="h-auto rounded-lg bg-[#E8AA4D] py-3 text-sm font-medium text-[#1a1a18] hover:bg-[#D09840]"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto rounded-lg py-3 text-sm font-normal text-white/80 hover:bg-white/5 hover:text-white dark:hover:bg-white/5"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </SheetClose>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
