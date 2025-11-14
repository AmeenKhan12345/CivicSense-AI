// src/app/api/complaints/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const complaintSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  file: z.instanceof(File),
});

export async function POST(request: Request) {
  console.log("\n--- New Complaint Submission Received ---");

  try {
    const form = await request.formData();
    
    // Step 1: Validate User Input
    const parsed = complaintSchema.safeParse({
      title: form.get("title"),
      description: form.get("description"),
      latitude: form.get("latitude"),
      longitude: form.get("longitude"),
      file: form.get("file"),
    });

    if (!parsed.success) {
      console.error("❌ Validation Failed:", parsed.error.flatten());
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { title, description, latitude, longitude, file } = parsed.data;
    console.log("✅ Step 1/4: Validation successful.");

    // Step 2: Upload Image to Supabase Storage
    const bucket = "issues";
    const path = `public/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, file);
    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    const imageUrl = urlData.publicUrl;
    console.log("✅ Step 2/4: Image uploaded successfully.");

    // Step 3: Generate Embedding via Local Ollama Server
    // NO ngrok needed! We call localhost directly.
    console.log("🧠 Step 3/4: Calling local Ollama server for embedding...");
    const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: `${title}. ${description}`,
      }),
    });
    if (!embeddingResponse.ok) {
      throw new Error(`Ollama Embedding API error: ${await embeddingResponse.text()}`);
    }
    const { embedding } = await embeddingResponse.json();
    console.log("✅ Step 3/4: Embedding generated successfully.");
    
    // Step 4: Insert the Complete Record into Supabase
    const complaintToInsert = {
      title,
      description,
      latitude,
      longitude,
      img_url: imageUrl,
      embedding: JSON.stringify(embedding), // Save the embedding
      status: 'new',
    };
    const { data: newComplaint, error: dbError } = await supabaseAdmin
      .from("issues")
      .insert(complaintToInsert)
      .select()
      .single();

    if (dbError) throw new Error(`Database Insert Error: ${dbError.message}`);
    console.log("✅ Step 4/4: Complaint saved to Supabase.");
    console.log("--- Submission Process Complete ---");

    return NextResponse.json(newComplaint);

  } catch (err: any) {
    console.error("🔥 An error occurred in the API route:", err.message);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}