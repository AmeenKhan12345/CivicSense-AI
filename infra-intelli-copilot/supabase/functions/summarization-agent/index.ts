// supabase/functions/summarization-agent/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'

// Get the Supabase credentials from the function's environment
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPA_SERVICE_KEY')! 
)

Deno.serve(async (_req) => {
  console.log("Summarization Agent started...");

  try {
    // 1. Get the date from 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch all issues created in the last 7 days
    const { data: issues, error: fetchError } = await supabaseAdmin
      .from('issues')
      .select('title, category, severity, status, description')
      .gt('created_at', sevenDaysAgo); // 'gt' means "greater than"

    if (fetchError) throw new Error(`DB Error: ${fetchError.message}`);
    if (!issues || issues.length === 0) {
      console.log("No new issues found in the last 7 days.");
      return new Response(JSON.stringify({ message: "No new issues to summarize." }), { status: 200 });
    }

    console.log(`Found ${issues.length} issues to summarize.`);
    // Convert the issue data into a simple text format for the AI
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
    // !! REMEMBER: Your ngrok tunnel must be running for this to work !!
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', { // NOTE: Use your ngrok URL here
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

    console.log("--- WEEKLY SUMMARY GENERATED ---");
    console.log(summary);
    // In a real product, we would save this 'summary' to a new 'reports' table.
    // For now, logging it is perfect.

    return new Response(JSON.stringify({ summary }), { status: 200 });

  } catch (err) {
    console.error("🔥 Summarization Agent Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})