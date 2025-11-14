// src/agents/summarize-weekly.ts

import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import path from 'path';

// --- ✅ FIX: Explicitly load .env.local ---
// This finds the .env.local file in your project's root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPA_SERVICE_KEY!;

// This check will now pass
if (!supabaseUrl) throw new Error('supabaseUrl is required. Check your .env.local file.');
if (!supabaseKey) throw new Error('SUPA_SERVICE_KEY is required. Check your .env.local file.');

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runSummarizationAgent() {
  console.log("🤖 Summarization Agent started...");

  try {
    // 1. Get the date from 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch all issues created in the last 7 days
    const { data: issues, error: fetchError } = await supabaseAdmin
      .from('issues')
      .select('title, category, severity, status, description')
      .gt('created_at', sevenDaysAgo);

    if (fetchError) throw new Error(`DB Error: ${fetchError.message}`);
    if (!issues || issues.length === 0) {
      console.log("✅ No new issues found in the last 7 days. Exiting.");
      return;
    }

    console.log(`🔍 Found ${issues.length} issues to summarize...`);
    const issuesText = issues.map(i => 
      `- ${i.title} (Category: ${i.category}, Severity: ${i.severity}, Status: ${i.status})`
    ).join('\n');

    // 3. Create a prompt for the summarization task
    const prompt = `
      You are an analyst for the Nagpur Municipal Corporation.
      Analyze the following list of raw complaints from the past week and generate a concise "Weekly Issue Bulletin" for a ward officer.
      
      The bulletin should include:
      1. A brief overview (e.g., "A total of ${issues.length} issues were reported...").
      2. A section on "Key Hotspots" or "Emerging Trends" (e.g., "Multiple 'Sewage' complaints in the Sitabuldi area.").
      3. A "Priority Issues" list for any 'High' or 'Critical' severity items.

      Here is the raw data:
      ${issuesText}
    `;

    // 4. Call your local Ollama server (Llama 3)
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
    const summary = aiResult.message.content;

    console.log("\n--- ✅ WEEKLY SUMMARY GENERATED ---");
    // --- ✅ 5. SAVE THE SUMMARY TO THE DATABASE ---
    const { error: insertError } = await supabaseAdmin
      .from('weekly_summaries')
      .insert({ summary_text: summary });

    if (insertError) {
      throw new Error(`DB Insert Error: ${insertError.message}`);
    }

    console.log("🎉 Weekly summary saved to the database!");

  } catch (err) {
    console.error("🔥 Summarization Agent Error:", (err as Error).message);
  }
}

// Run the agent
runSummarizationAgent();