// src/components/LoginForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheckIcon } from '@heroicons/react/24/outline'; // Re-using our icon

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Sending magic link...");
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // --- ✅ FIX: Point to the new auth callback route ---
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) throw error;
      setStatus("Success! Check your email for the magic link.");
    } catch (error: any) {
      setError("Error: " + error.message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <div className="p-3 bg-indigo-600 rounded-full mb-2">
          <ShieldCheckIcon className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">CivicSense AI</CardTitle>
        <CardDescription>Officer Triage Portal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="officer@nmc.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>

          {status && <p className="text-sm text-center text-green-600 pt-2">{status}</p>}
          {error && <p className="text-sm text-center text-red-600 pt-2">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}