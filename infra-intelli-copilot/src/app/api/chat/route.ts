// src/app/api/chat/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // 1. Generate an embedding for the user's question
    const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: question,
      }),
    });
    if (!embeddingResponse.ok) throw new Error(`Ollama Embedding API error: ${await embeddingResponse.text()}`);
    const { embedding } = await embeddingResponse.json();

    // 2. Retrieve relevant issues (this query now returns more data)
    const { data: relevantIssues, error: matchError } = await supabaseAdmin.rpc('match_issues', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.70,
      match_count: 20,
    });
    if (matchError) throw new Error(`RPC Error: ${matchError.message}`);

    // --- ✅ UPDATED CONTEXT STRING ---
    // We can now build a much more informative context for the AI
    const contextText = relevantIssues.map((i: any) => 
      `- Issue (ID ${i.id}): ${i.title} (Status: ${i.status || 'N/A'}, Severity: ${i.severity || 'N/A'}, Reported: ${new Date(i.created_at).toLocaleDateString()})`
    ).join('\n');

    // 3. Generate a conversational answer (prompt is the same)
    const prompt = `
  You are a professional and helpful AI assistant for a Nagpur Municipal Corporation officer.

  **Your first rule is to be conversational:** If the user's question is a simple greeting or small talk (like "Hi", "Hello", "How are you?", "Thanks"), respond politely.

  **Your second rule is to answer questions using context:** For all other questions, you must answer *only* based on the provided context of relevant civic issues.
  - If the context is sufficient, answer the question.
  - If the context is empty or insufficient, politely say "I do not have enough information to answer that."

  **Context (Relevant Issues):**
  ${contextText || "No relevant issues found."}

  **Officer's Question:**
  ${question}

  **Answer:**
`;

    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) throw new Error(`Ollama Chat API error: ${await ollamaResponse.text()}`);

    const aiResult = await ollamaResponse.json();
    const answer = aiResult.message.content;

    return NextResponse.json({ answer });

  } catch (err: any) {
    console.error("🔥 Chat API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}