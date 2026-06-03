"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function ProfileAvatar({
  src,
  initials,
  alt,
}: {
  src?: string | null;
  initials: string;
  alt: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = Boolean(src);

  // Close on Escape while expanded.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <>
      {/* Small avatar — shares `layoutId` with the expanded one so framer-motion
          morphs smoothly between the two sizes. */}
      <motion.button
        type="button"
        layoutId="profile-photo"
        onClick={() => canExpand && setExpanded(true)}
        style={{ borderRadius: 16 }}
        className={cn(
          "relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#e0b079] to-[#cf9355] shadow-[0_8px_24px_-8px_rgba(207,147,85,0.5)]",
          canExpand ? "cursor-zoom-in" : "cursor-default"
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="font-heading text-3xl font-medium text-[#3d2817]">
            {initials}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {expanded && src && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Blurred backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/5 backdrop-blur-sm"
              onClick={() => setExpanded(false)}
            />
            {/* Expanded square — same layoutId = it grows out of the small frame */}
            <motion.img
              layoutId="profile-photo"
              src={src}
              alt={alt}
              onClick={() => setExpanded(false)}
              style={{ borderRadius: 24 }}
              className="relative z-10 aspect-square w-[min(80vw,80vh,560px)] cursor-zoom-out object-cover shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
