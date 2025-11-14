// src/app/api/analyze-issue/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const aiResponseSchema = z.object({
  category: z.string(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  explanation: z.string(),
});

export async function POST(request: Request) {
  try {
    const { issueId } = await request.json();
    if (!issueId) {
      return NextResponse.json({ error: "issueId is required" }, { status: 400 });
    }

    // 1. Fetch the full issue details
    const { data: issue, error: fetchError } = await supabaseAdmin
      .from('issues')
      .select('id, title, description, embedding')
      .eq('id', issueId)
      .single();
    if (fetchError) throw new Error(`Database Error: ${fetchError.message}`);

    // 2. RETRIEVE similar issues using the existing embedding (RAG)
    const { data: similarIssues, error: matchError } = await supabaseAdmin.rpc('match_issues', {
      query_embedding: issue.embedding,
      match_threshold: 0.75,
      match_count: 3,
    });
    if (matchError) throw new Error(`RPC Error: ${matchError.message}`);
    const contextText = similarIssues.map((i: any) => `- Title: ${i.title}, Description: ${i.description}`).join('\n');

    // 3. CLASSIFY with the main LLM (Llama 3)
    const prompt = `
      You are an expert civic issue classifier for Nagpur, India. Analyze the issue and its historical context.

      **New Issue:**
      - Title: "${issue.title}"
      - Description: "${issue.description}"

      **Historical Context (Similar Past Issues):**
      ${contextText || "No similar issues found."}

      **Your Tasks:**
      1. Determine the "category". Options: "Pothole", "Garbage", "Streetlight", "Sewage", "Water Leakage", "Damaged Signage", "Other".
      2. Determine the "severity". Options: "Low", "Medium", "High", "Critical".
      3. Provide a brief "explanation" (1-2 sentences) for your classification, referencing the context if relevant.

      Respond ONLY with a valid JSON object in the format: {"category": "...", "severity": "...", "explanation": "..."}
    `;

    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3',
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false,
      }),
    });
    if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${await ollamaResponse.text()}`);

    const aiResult = await ollamaResponse.json();
    const parsedAiResult = aiResponseSchema.safeParse(JSON.parse(aiResult.message.content));
    if (!parsedAiResult.success) throw new Error("AI returned invalid data format.");

    const { category, severity, explanation } = parsedAiResult.data;
    // --- ✅ STEP 4: UPDATE THE DATABASE WITH AI RESULTS ---
    const { error: updateError } = await supabaseAdmin
      .from('issues')
      .update({
        category: category,
        severity: severity,
        // We could also store the explanation if we add a column for it
      })
      .eq('id', issueId);
      
    if (updateError) {
      // Log the error but don't fail the entire request, as the analysis was still successful
      console.error("Failed to update issue in DB:", updateError);
    } else {
      console.log(`🔄 Issue ${issueId} updated with AI analysis.`);
    }


    // 5. Return the full analysis
    return NextResponse.json({
      analysis: parsedAiResult.data,
      similarIssues: similarIssues,
    });

  } catch (err: any) {
    console.error("🔥 Analysis API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}