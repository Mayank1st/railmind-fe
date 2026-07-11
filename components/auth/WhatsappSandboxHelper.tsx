"use client";

import { useEffect, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CircleHelp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WhatsappIcon } from "@/components/auth/WhatsappIcon";

const SANDBOX_NUMBER = "+1 415 523 8886";
const JOIN_CODE = "join fat-dog";

interface WhatsappSandboxHelperProps {
  /** Open the helper immediately (e.g. right after a delivery failure). */
  defaultOpen?: boolean;
}

/**
 * "Didn't receive the OTP?" helper for the Twilio WhatsApp sandbox (trial)
 * setup. OTPs only reach numbers that have joined the sandbox, so this shows
 * an animated GIF-style chat loop of the one-time join step in a popover
 * anchored to the trigger text. Once the backend moves to an approved
 * WhatsApp sender this component can be deleted.
 */
export function WhatsappSandboxHelper({
  defaultOpen = false,
}: WhatsappSandboxHelperProps) {
  // Popover opens to the right of the trigger on desktop; below it on small
  // screens where there's no horizontal room for the card.
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-foreground/50 hover:text-foreground/80 mx-auto flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          Didn&apos;t receive the OTP on WhatsApp?
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={isWide ? "right" : "bottom"}
        sideOffset={10}
        collisionPadding={16}
        // Elevated surface (same tone as the login form inputs) — the default
        // --popover token is nearly identical to the page bg, which made the
        // popover and its arrow tail invisible against it.
        className="w-80 max-w-[calc(100vw-2rem)] bg-[#2a2a28] p-3"
      >
        <div className="space-y-3">
          {/* ── Animated chat loop (GIF-style, pure CSS) ── */}
          <div className="rounded-lg bg-[#0b141a] p-3">
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25d366]">
                <WhatsappIcon className="h-4 w-4 text-[#0b141a]" />
              </div>
              <div className="text-left">
                <p className="text-foreground text-xs font-medium">
                  Twilio Sandbox
                </p>
                <p className="text-[10px] text-white/40">{SANDBOX_NUMBER}</p>
              </div>
            </div>

            {/* Chat messages — looped via keyframes below */}
            <div className="mt-2 min-h-[108px] space-y-1.5 text-xs">
              {/* You: typing… */}
              <div className="wa-typing flex justify-end opacity-0">
                <span className="flex items-center gap-1 rounded-lg rounded-br-sm bg-[#005c4b] px-3 py-2">
                  <span className="wa-dot h-1 w-1 rounded-full bg-white/80" />
                  <span className="wa-dot h-1 w-1 rounded-full bg-white/80 [animation-delay:0.2s]" />
                  <span className="wa-dot h-1 w-1 rounded-full bg-white/80 [animation-delay:0.4s]" />
                </span>
              </div>
              {/* You: join code */}
              <div className="wa-msg wa-msg-join flex justify-end opacity-0">
                <span className="rounded-lg rounded-br-sm bg-[#005c4b] px-2.5 py-1.5 text-white">
                  {JOIN_CODE}
                </span>
              </div>
              {/* Twilio: confirmation */}
              <div className="wa-msg wa-msg-ok flex justify-start opacity-0">
                <span className="rounded-lg rounded-bl-sm bg-[#202c33] px-2.5 py-1.5 text-white/90">
                  ✅ You are all set! Sandbox joined.
                </span>
              </div>
              {/* Twilio: the OTP finally arrives */}
              <div className="wa-msg wa-msg-otp flex justify-start opacity-0">
                <span className="rounded-lg rounded-bl-sm bg-[#202c33] px-2.5 py-1.5 text-white/90">
                  🔐 Your RailMind OTP: <strong>482913</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ── Why + steps ── */}
          <div className="text-left text-xs leading-relaxed text-white/50">
            <p>
              Our WhatsApp OTP is on a{" "}
              <span className="text-white/70">Twilio trial (sandbox)</span>{" "}
              right now, so codes only reach numbers linked to the sandbox.
              One-time setup:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Open WhatsApp on the phone with this number</li>
              <li>
                Send{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/80">
                  {JOIN_CODE}
                </code>{" "}
                to{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/80">
                  {SANDBOX_NUMBER}
                </code>
              </li>
              <li>
                After Twilio confirms, come back and tap{" "}
                <span className="text-white/70">Resend OTP</span>
              </li>
            </ol>
            <p className="mt-2 text-[11px] text-white/35">
              The link lapses after 24 hours of inactivity — just send the join
              code again if OTPs stop arriving.
            </p>
          </div>
        </div>

        {/* Curved speech-bubble tail pointing back at the trigger. Radix
            rotates it per side; the base edge overlaps the content by 1px so
            it merges seamlessly with the popover (no ring seam at the join —
            the outline path deliberately leaves the base open). */}
        <PopoverPrimitive.Arrow asChild width={22} height={11}>
          <svg
            viewBox="0 0 22 11"
            preserveAspectRatio="none"
            fill="none"
            className="z-50 -translate-y-px"
          >
            <path
              d="M0 0 C6.5 1 9.6 5.5 10.3 8.6 C10.6 9.9 11.4 9.9 11.7 8.6 C12.4 5.5 15.5 1 22 0 Z"
              className="fill-[#2a2a28]"
            />
          </svg>
        </PopoverPrimitive.Arrow>

        {/* Looped 9s timeline: typing → join code → confirmation → OTP → reset */}
        <style>{`
          .wa-typing {
            animation: wa-typing 9s ease-in-out infinite;
          }
          .wa-msg {
            animation-duration: 9s;
            animation-timing-function: ease-out;
            animation-iteration-count: infinite;
          }
          .wa-msg-join { animation-name: wa-msg-join; }
          .wa-msg-ok { animation-name: wa-msg-ok; }
          .wa-msg-otp { animation-name: wa-msg-otp; }
          .wa-dot {
            animation: wa-dot 1.2s ease-in-out infinite;
          }
          @keyframes wa-typing {
            0% { opacity: 0; transform: translateY(4px); }
            3%, 15% { opacity: 1; transform: translateY(0); }
            18%, 100% { opacity: 0; transform: translateY(4px); }
          }
          @keyframes wa-msg-join {
            0%, 16% { opacity: 0; transform: translateY(6px); }
            19%, 93% { opacity: 1; transform: translateY(0); }
            98%, 100% { opacity: 0; transform: translateY(0); }
          }
          @keyframes wa-msg-ok {
            0%, 42% { opacity: 0; transform: translateY(6px); }
            45%, 93% { opacity: 1; transform: translateY(0); }
            98%, 100% { opacity: 0; transform: translateY(0); }
          }
          @keyframes wa-msg-otp {
            0%, 66% { opacity: 0; transform: translateY(6px); }
            69%, 93% { opacity: 1; transform: translateY(0); }
            98%, 100% { opacity: 0; transform: translateY(0); }
          }
          @keyframes wa-dot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-3px); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .wa-typing { display: none; }
            .wa-msg { animation: none; opacity: 1; transform: none; }
            .wa-dot { animation: none; }
          }
        `}</style>
      </PopoverContent>
    </Popover>
  );
}
