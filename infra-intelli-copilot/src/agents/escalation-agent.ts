// src/agents/escalation-agent.ts

import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPA_SERVICE_KEY!;

if (!supabaseUrl) throw new Error('supabaseUrl is required.');
if (!supabaseKey) throw new Error('SUPA_SERVICE_KEY is required.');

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// --- Configuration ---
// The agent will flag issues older than this (in hours)
const ESCALATION_THRESHOLD_HOURS = 0.01; // For testing, set to 0.01 hours (~36 seconds)

async function runEscalationAgent() {
  console.log("🤖 Escalation Agent started...");

  try {
    // 1. Get the timestamp for 48 hours ago
    const thresholdDate = new Date(Date.now() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();

    // 2. Find all issues that are:
    //    - 'High' or 'Critical'
    //    - Still have a 'new' status
    //    - Were created before the threshold date
    const { data: issuesToEscalate, error: fetchError } = await supabaseAdmin
      .from('issues')
      .select('id, title, category, severity, description, created_at')
      .in('severity', ['High', 'Critical'])
      .eq('status', 'new')
      .lt('created_at', thresholdDate); // 'lt' means "less than"

    if (fetchError) throw new Error(`DB Error: ${fetchError.message}`);
    if (!issuesToEscalate || issuesToEscalate.length === 0) {
      console.log("✅ No issues found requiring escalation. Exiting.");
      return;
    }

    console.log(`🔍 Found ${issuesToEscalate.length} issues to escalate...`);

    // 3. Process each issue and draft an escalation
    for (const issue of issuesToEscalate) {
      const prompt = `
        You are a senior analyst at the Nagpur Municipal Corporation (NMC).
        A high-priority civic issue has not been addressed for over 48 hours.
        Draft a formal and urgent escalation email to the head of the relevant department.

        The email must:
        1. Clearly state the issue ID, title, and category.
        2. Emphasize the 'High' or 'Critical' severity.
        3. Note that it has been pending for over 48 hours.
        4. Request an immediate status update and action.

        Issue Details:
        - ID: ${issue.id}
        - Title: "${issue.title}"
        - Category: "${issue.category}"
        - Severity: "${issue.severity}"
        - Description: "${issue.description}"

        Respond ONLY with a valid JSON object in the format: {"subject": "...", "body": "..."}
      `;

      // 4. Call your local Ollama server
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
      const { subject, body } = JSON.parse(aiResult.message.content);
      const escalationDraft = aiResult.message.content;

      // 5. Save the draft to the database
      const { error: insertError } = await supabaseAdmin
        .from('escalation_drafts')
        .insert({
          issue_id: issue.id,
          draft_subject: subject,
          draft_body: body,
        });

      if (insertError) {
        console.error(`Failed to save draft for issue ${issue.id}:`, insertError);
      } else {
        console.log(`✅ Escalation draft saved for issue #${issue.id}`);
      }
    }
  } catch (err) {
    console.error("🔥 Escalation Agent Error:", (err as Error).message);
  }
}

// Run the agent
runEscalationAgent();