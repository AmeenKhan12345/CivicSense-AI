// src/app/api/log-feedback/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { 
      issueId, 
      originalCategory, 
      originalSeverity, 
      correctedCategory, 
      correctedSeverity 
    } = await request.json();

    if (!issueId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback_log')
      .insert({
        issue_id: issueId,
        original_category: originalCategory,
        original_severity: originalSeverity,
        corrected_category: correctedCategory,
        corrected_severity: correctedSeverity,
      });

    if (error) throw new Error(error.message);

    console.log(`✅ Feedback logged for issue: ${issueId}`);
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("🔥 Log Feedback API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}