"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface KycPhotoDialogProps {
  /** Local object URL of the captured photo. Never the backend document_path. */
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full-size look at the captured card, so the user can actually read the small
 * print they are being asked to check against the form. The photo never leaves
 * the browser — this renders the same local object URL as the thumbnail.
 */
export function KycPhotoDialog({
  src,
  alt,
  open,
  onOpenChange,
}: KycPhotoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // The image is the dialog — no card, no padding behind it.
        className="w-auto max-w-[min(92vw,64rem)] gap-0 bg-transparent p-0 shadow-none ring-0"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] w-auto rounded-xl object-contain"
        />

        <DialogClose
          aria-label="Close photo"
          className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
        >
          <X className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
