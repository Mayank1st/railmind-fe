"use client";

import { useEffect } from "react";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { stationsQueryOptions } from "@/hooks/useStationSearch";

export function StationsPrefetch() {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();

  useEffect(() => {
    if (isRestoring) return;
    queryClient.prefetchQuery(stationsQueryOptions);
  }, [queryClient, isRestoring]);

  return null;
}
