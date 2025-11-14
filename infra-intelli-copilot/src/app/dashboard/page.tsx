// src/app/dashboard/page.tsx
import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table" // Import the new components
import {
  Button
} from "@/components/ui/button" // Import the button

type Issue = {
  id: string;
  title: string;
  status: string;
  severity: string | null;
  category: string | null; // ✅ Added category
  created_at: string;
}

// --- Type for our summary ---
type Summary = {
  id: number;
  summary_text: string;
  created_at: string;
}

// Add a type for Escalation Drafts
type Draft = {
  id: number;
  draft_subject: string;
  draft_body: string;
  issues: { // We'll fetch the linked issue's title
    title: string;
  }
}

export default async function DashboardPage() {
  //1. Fetch Issues
  const { data: issues, issuesError } = await supabaseAdmin
    .from('issues')
    // Fetch category from the database
    .select('id, title, status, severity, category, created_at') 
    .order('created_at', { ascending: false });
  
  // --- 2. Fetch the LATEST weekly summary ---
  const { data: latestSummary, error: summaryError } = await supabaseAdmin
    .from('weekly_summaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1) // Get only the most recent one
    .single(); // Get a single object, not an array

  // 3. Fetch Pending Escalation Drafts
  const { data: drafts, error: draftsError } = await supabaseAdmin
    .from('escalation_drafts')
    .select(`
      id, draft_subject, draft_body,
      issues ( title )
    `)
    .eq('is_sent', false) // Only get unsent drafts
    .order('created_at', { ascending: true });

  if (issuesError) {
    return <p className="text-red-500">Failed to load issues: {error.message}</p>;
  }
  if (summaryError) {
    console.log("No weekly summary found (this is not a critical error).");
  }

  return (
    // We use the bg-white from the layout, so just add padding
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Issue Triage Center</h1>
          <p className="mt-2 text-lg text-gray-600">A prioritized list of all submitted civic complaints.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16">
          <Link href="/dashboard/chat">
            {/* --- ✅ USE THE SHADCN BUTTON --- */}
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Go to AI Chat Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* --- Display the Weekly Summary --- */}
      {latestSummary && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900">This Week's AI Bulletin</h2>
          <p className="text-sm text-blue-700 mb-4">
            Generated on {new Date(latestSummary.created_at).toLocaleDateString('en-IN')}
          </p>
          {/* Use <pre> to respect the line breaks from the AI's response */}
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans bg-white p-4 rounded-md">
            {latestSummary.summary_text}
          </pre>
        </div>
      )}

      {/* 4. Display the Escalation Drafts Section */}
      {drafts && drafts.length > 0 && (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-900">Pending Escalations for Review</h2>
          <p className="text-sm text-red-700 mb-4">The following high-priority issues have been pending and require escalation.</p>
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white p-4 rounded-md shadow-sm border">
                <h3 className="font-semibold text-gray-900">Subject: {draft.draft_subject}</h3>
                <p className="text-sm text-gray-500 mb-2">Regarding Issue: {draft.issues.title}</p>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans p-2 bg-gray-50 rounded-md">{draft.draft_body}</pre>
                <button className="mt-2 rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                  Review & Send
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- The Issue Table--- */}
      {/* --- ✅ POLISHED TABLE --- */}
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] font-semibold">Issue Title</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Severity</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date Reported</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues?.map((issue: any) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.title}</TableCell>
                <TableCell className="text-gray-600">{issue.category || 'N/A'}</TableCell>
                <TableCell className="text-gray-600">{issue.severity || 'N/A'}</TableCell>
                <TableCell className="text-gray-600">{issue.status}</TableCell>
                <TableCell className="text-gray-600">{new Date(issue.created_at).toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/issue/${issue.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}