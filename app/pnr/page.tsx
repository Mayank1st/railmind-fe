"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Status badge colors
const statusBadge: Record<string, string> = {
  CNF: "bg-emerald-500/20 text-emerald-400",
  CAN: "bg-red-500/20 text-red-400",
  WL: "bg-amber-500/20 text-amber-400",
  RAC: "bg-orange-500/20 text-orange-400",
};

// Recently checked — localStorage se aayega baad mein
const recentPnrs = [
  {
    pnr: "4667965213",
    train: "12951 Mumbai Rajdhani",
    date: "01 May",
    status: "CAN",
  },
  {
    pnr: "8821330456",
    train: "12028 Shatabdi Exp",
    date: "03 May",
    status: "CNF",
  },
  {
    pnr: "6612904778",
    train: "12909 Garib Rath",
    date: "05 May",
    status: "WL",
  },
  {
    pnr: "7791445221",
    train: "22221 CSMT Rajdhani",
    date: "08 May",
    status: "RAC",
  },
];

export default function PnrPage() {
  const router = useRouter();
  const [pnr, setPnr] = useState("");

  const handleCheck = () => {
    if (pnr.length !== 10) return;
    router.push(`/pnr/${pnr}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck();
  };

  return (
    <main className="min-h-screen bg-[#1a1a18]">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#c8b48a20,transparent)]" />

        <div className="relative z-10 mx-auto max-w-[700px] px-6 pt-20 pb-16 text-center">
          {/* Badge */}
          <span className="border-accent-warm/30 text-accent-warm mb-8 inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
            <span className="bg-accent-warm h-2 w-2 rounded-full" />
            Now with movement prediction
          </span>

          {/* Heading */}
          <h1 className="text-foreground mt-6 text-[32px] leading-[1.1] font-normal tracking-[-0.5px] sm:text-[40px] sm:tracking-[-1px] lg:text-[48px] lg:leading-[1.05]">
            Check your PNR status
          </h1>

          {/* Subtext */}
          <p className="text-foreground/50 mt-4 text-[17px]">
            Enter your 10-digit PNR. We&apos;ll show live position and
            confirmation chance.
          </p>

          {/* Input + Button */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={pnr}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPnr(val);
              }}
              onKeyDown={handleKeyDown}
              placeholder="4667965213"
              className="text-foreground placeholder:text-foreground/30 focus:ring-accent-warm/50 flex-1 rounded-xl bg-[#2a2a28] px-6 py-4 text-lg outline-none focus:ring-1"
            />
            <button
              onClick={handleCheck}
              disabled={pnr.length !== 10}
              className="bg-accent-warm w-full cursor-pointer rounded-xl px-8 py-4 text-sm font-medium whitespace-nowrap text-white hover:opacity-90 disabled:opacity-40 sm:w-auto"
            >
              Check Status
            </button>
          </div>

          {/* Note */}
          <p className="text-foreground/30 mt-4 text-sm">
            No login required. Status updates every 15 minutes.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Recently Checked */}
      <div className="mx-auto max-w-[700px] px-6 py-16">
        <h2 className="text-foreground mb-6 text-2xl">Recently checked</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recentPnrs.map((item) => (
            <button
              key={item.pnr}
              onClick={() => router.push(`/pnr/${item.pnr}`)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121713] px-5 py-4 text-left hover:border-white/20"
            >
              <div className="min-w-0">
                <p className="text-foreground font-mono text-base font-medium">
                  {item.pnr}
                </p>
                <p className="text-foreground/40 mt-0.5 truncate text-sm">
                  {item.train} · {item.date}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium ${statusBadge[item.status]}`}
              >
                {item.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
