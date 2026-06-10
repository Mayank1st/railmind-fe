import { useMutation } from "@tanstack/react-query";
import { receiptsApi } from "@/lib/receipt";

// Pulls the PDF down as a blob and triggers a real download with its filename.
// If the storage host blocks cross-origin fetch (CORS), fall back to opening
// the PDF in a new tab so the user can still save it.
async function savePdf(url: string) {
  const filename = url.split("/").pop() || "e-ticket.pdf";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// Requests the e-ticket PDF for a booking, then downloads it.
export function useDownloadTicket() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const url = await receiptsApi.ticketUrl(bookingId);
      await savePdf(url);
      return url;
    },
  });
}
