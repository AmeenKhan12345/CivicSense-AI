// src/app/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LoginForm from "@/components/LoginForm";

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );

  // Check if the user is already logged in
  const { data: { session } } = await supabase.auth.getSession();

  // If logged in, redirect to the dashboard immediately
  if (session) {
    redirect('/dashboard');
  }

  // If not logged in, show the polished login page
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <LoginForm />
    </main>
  );
}