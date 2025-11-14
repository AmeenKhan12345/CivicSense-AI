// src/app/api/suggest-plan/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema to validate the data we receive from the frontend
const issueSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  severity: z.string(),
});

export async function POST(request: Request) {
  try {
    const issue = await request.json();
    const parsedIssue = issueSchema.safeParse(issue);

    if (!parsedIssue.success) {
      return NextResponse.json({ error: "Invalid issue data" }, { status: 400 });
    }
    const { title, description, category, severity } = parsedIssue.data;

    // This prompt is highly specific to the task
    const prompt = `
      You are an operations manager for the Nagpur Municipal Corporation.
      An officer needs an immediate, short, actionable checklist for a field team to address the following issue.
      Respond ONLY with a numbered list of 3-5 brief, practical steps. Do not add any conversational text before or after the list.

      Issue Details:
      - Title: "${title}"
      - Description: "${description}"
      - Category: "${category}"
      - Severity: "${severity}"

      Example Response:
      1. Deploy safety cones and warning signs around the area.
      2. Assess the structural integrity and size of the pothole.
      3. Clear any water or debris from the hole.
      4. Fill with cold patch asphalt and compact the surface.
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
    const plan = aiResult.message.content;

    return NextResponse.json({ plan });

  } catch (err: any) {
    console.error("🔥 Suggest Plan API Error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}