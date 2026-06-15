"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  ClipboardList,
  Clock,
  CreditCard,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
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
  { label: "Saved Passengers", href: "/passengers", icon: Users },
  { label: "Profile & Settings", href: "/profile", icon: Settings },
  { label: "Help & Support", href: "/help", icon: LifeBuoy },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const reset = useAuthStore((s) => s.reset);
  const authed = status === "authed";

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
        className="w-[82%] bg-[#0e1210] p-0 sm:max-w-sm"
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

        <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-2">
          {menu.map((item) => {
            const active = isActive(item.href);
            return (
              <SheetClose asChild key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-lg px-3 py-3 text-base transition-colors",
                    active
                      ? "bg-white/5 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="size-5 text-white/50" />
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <SheetFooter className="border-t border-white/8">
          {authed ? (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-auto justify-start gap-3 px-3 py-3 text-base font-normal text-red-300 hover:bg-red-500/10 hover:text-red-200 dark:hover:bg-red-500/10"
            >
              <LogOut className="size-5" />
              Logout
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
