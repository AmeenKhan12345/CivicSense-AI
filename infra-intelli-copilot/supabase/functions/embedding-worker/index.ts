// supabase/functions/embedding-worker/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPA_SERVICE_KEY')!
)

Deno.serve(async (_req) => {
  console.log("Embedding worker running...");

  try {
    // 1. Find pending jobs in the queue
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('embedding_queue')
      .select(`
        id,
        issues (id, title, description)
      `)
      .eq('status', 'pending')
      .limit(5); // Process 5 jobs at a time

    if (fetchError) throw fetchError;
    if (jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending jobs." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Found ${jobs.length} pending jobs.`);

    // 2. Process each job
    for (const job of jobs) {
      const issue = job.issues;
      const content = issue.title + '. ' + issue.description;

      // Call Ollama to generate embedding
      const ollamaResponse = await fetch('https://356836b47076.ngrok-free.app/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: content }),
      });

      if (!ollamaResponse.ok) throw new Error(`Ollama API error for job ${job.id}`);

      const { embedding } = await ollamaResponse.json();

      // Update the original issue with the embedding
      await supabaseAdmin
        .from('issues')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', issue.id);

      // Mark the job as completed
      await supabaseAdmin
        .from('embedding_queue')
        .update({ status: 'completed' })
        .eq('id', job.id);

      console.log(`✅ Processed job ${job.id} for issue ${issue.id}`);
    }

    return new Response(JSON.stringify({ message: `Successfully processed ${jobs.length} jobs.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error("Worker error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})