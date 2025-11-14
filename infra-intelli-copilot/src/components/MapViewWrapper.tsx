// src/components/MapViewWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapViewWrapper({ onLocationChange }: any) {
  return (
    <Suspense fallback={<div className="h-[420px] flex items-center justify-center">Loading map...</div>}>
      <MapView onLocationChange={onLocationChange} />
    </Suspense>
  );
}
