// Sticky bottom action bar for the booking flow — mobile only (lg:hidden).
// The desktop layouts keep their right-column summary card; on mobile the
// primary action + total live here. Pages add bottom padding so content
// doesn't hide behind it.
export function MobileActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#121713]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
}
