// src/components/ClientOnly.tsx
"use client";

import { useEffect, useState } from "react";

// This component ensures its children are only rendered on the client side.
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // On the server and during initial client render, render nothing.
  }

  return <>{children}</>;
}