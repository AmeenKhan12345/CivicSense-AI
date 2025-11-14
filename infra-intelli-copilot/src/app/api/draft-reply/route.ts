// src/app/api/draft-reply/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema to validate the incoming data
const issueSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  severity: z.string(),
  status: z.string(),
});

export async function POST(request: Request) {
  try {
    const issue = await request.json();
    const parsedIssue = issueSchema.safeParse(issue);

    if (!parsedIssue.success) {
      return NextResponse.json({ error: "Invalid issue data" }, { status: 400 });
    }
    const { title, description, category, severity, status } = parsedIssue.data;

    // Prompt designed for formal communication
    const prompt = `
      You are an experienced administrative assistant at the Nagpur Municipal Corporation (NMC).
      Draft a formal, polite, and concise reply regarding the following civic issue.
      The reply should acknowledge the issue and briefly state its current status.
      Maintain a professional tone suitable for official NMC communication.
      Do not add greetings like "Dear Citizen" or sign-offs. Respond only with the body of the reply.

      **Issue Details:**
      - Title: "${title}"
      - Category: "${category}"
      - Severity: "${severity}"
      - Current Status: "${status}"

      **Example Reply:**
      "We acknowledge receipt of your report regarding the ${category.toLowerCase()} issue titled '${title}'. The matter is currently ${status === 'new' ? 'under review' : status === 'in_progress' ? 'being addressed by the relevant department' : 'marked as resolved'}. Thank you for bringing this to our attention."
    `;

    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${await ollamaResponse.text()}`);

    const aiResult = await ollamaResponse.json();
    const reply = aiResult.message.content;

    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("🔥 Draft Reply API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}