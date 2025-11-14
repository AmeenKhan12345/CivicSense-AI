// ReportClient.tsx (client)
"use client";
import { useEffect, useState } from "react";
import MapViewWrapper from "./MapViewWrapper";
import ReportIssueForm from "./ReportIssueForm";

export default function ReportClient() {
  const [sessionChecked, setSessionChecked] = useState(false);
  // fetch session in effect...
  useEffect(() => {
    // check session then setSessionChecked(true)
    setTimeout(() => setSessionChecked(true), 0); // placeholder pattern
  }, []);

  // Stable server-like placeholder to avoid hydration mismatch
  if (!sessionChecked) {
    return <div className="min-h-screen p-6">Loading…</div>;
  }

  // After session checked render the real UI
  return (
    <div>
      <MapViewWrapper onLocationChange={() => {}} />
      <ReportIssueForm location={null} />
    </div>
  );
}
