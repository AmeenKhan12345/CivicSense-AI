// src/app/dashboard/issue/[id]/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import IssueDetailClient from './issue-detail-client';

// The helper function to create a Supabase client remains the same
const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  return createServerClient(
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
};

// --- ✅ FIX: Destructure `{ id }` directly from `params` here ---
export default async function IssueDetailPage({ params: { id } }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  
  // Now, use the destructured `id` variable directly in your query
  const { data: issue, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id) // Use the `id` variable
    .single();

  if (error || !issue) {
    return (
      <div className="p-8">
        <p className="text-red-500">Could not load the issue.</p>
        <p className="text-sm text-gray-500 mt-2">Error details: {error?.message}</p>
      </div>
    );
  }
  
  // Render the Client Component, passing the fetched issue data as a prop
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <IssueDetailClient issue={issue} />
    </div>
  );
}