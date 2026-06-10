"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, ZoomIn } from "lucide-react";

import { getCroppedBlob } from "@/lib/cropImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function PhotoCropDialog({
  imageSrc,
  onCancel,
  onCropped,
}: {
  imageSrc: string | null;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_: Area, areaInPixels: Area) => setAreaPixels(areaInPixels),
    []
  );

  async function handleSave() {
    if (!imageSrc || !areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      onCropped(file);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog
      open={Boolean(imageSrc)}
      onOpenChange={(open) => !open && onCancel()}
    >
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Crop your photo</DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom to frame your face.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="text-muted-foreground h-4 w-4 shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={([z]) => setZoom(z)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={processing}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={processing || !areaPixels}
            className="rounded-full bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            Save photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
