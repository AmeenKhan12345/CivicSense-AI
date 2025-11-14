// src/app/api/update-issue/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { issueId, status, category, severity } = await request.json();

    if (!issueId || !status) {
      return NextResponse.json({ error: "issueId and status are required" }, { status: 400 });
    }

    // Build the update object dynamically
    const updateData: { status: string; category?: string; severity?: string } = { status };
    if (category) updateData.category = category;
    if (severity) updateData.severity = severity;

    const { data, error } = await supabaseAdmin
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    console.log(`✅ Issue ${issueId} status updated to: ${status}`);
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("🔥 Update Issue API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}