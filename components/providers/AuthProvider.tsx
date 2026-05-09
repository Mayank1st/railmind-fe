"use client";

import { useEffect } from "react";
import { authApi } from "@/lib/auth";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({
  initialAuthed,
  children,
}: {
  initialAuthed: boolean;
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    if (!initialAuthed) {
      setStatus("guest");
      return;
    }
    let cancelled = false;
    authApi
      .me()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [initialAuthed, setUser, setStatus]);

  return <>{children}</>;
}
