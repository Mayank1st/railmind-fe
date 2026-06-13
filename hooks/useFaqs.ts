import { useQueries } from "@tanstack/react-query";
import { faqApi, FAQ_TOPICS } from "@/lib/faq";

// FAQs change rarely — fetch every category once, keep them long, and let the
// help page filter/search the merged set client-side (same approach as the
// station list). Each request is category-scoped to match the /faq/all contract.
const STALE = 10 * 60 * 1000;

export function useAllFaqs() {
  const results = useQueries({
    queries: FAQ_TOPICS.map((t) => ({
      queryKey: ["faq", t.key] as const,
      queryFn: () => faqApi.all({ category: t.key, size: 50 }),
      staleTime: STALE,
      gcTime: STALE,
    })),
  });

  return {
    items: results.flatMap((r) => r.data?.items ?? []),
    isLoading: results.some((r) => r.isLoading),
    // Only a hard error if every category failed; partial data still renders.
    isError: results.length > 0 && results.every((r) => r.isError),
  };
}
