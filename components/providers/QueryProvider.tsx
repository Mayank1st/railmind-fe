"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState } from "react";

const PERSIST_BUSTER = "stations-v1";
const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days on disk

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  const [persister] = useState(() =>
    createAsyncStoragePersister({
      key: "railmind-rq",
      storage: {
        getItem: (k) => get<string>(k).then((v) => v ?? null),
        setItem: (k, v) => set(k, v),
        removeItem: (k) => del(k),
      },
    })
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.queryKey[0] === "stations" && q.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
