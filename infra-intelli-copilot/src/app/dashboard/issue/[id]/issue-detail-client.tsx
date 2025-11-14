// src/app/dashboard/issue/[id]/issue-detail-client.tsx
"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner"; 

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Dynamically import the map component
const IssueMap = dynamic(() => import('@/components/IssueMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 flex items-center justify-center"><p>Loading map...</p></div>
});

// Type definitions
type Issue = { id: string; title: string; description: string; status: string; img_url: string; latitude: number; longitude: number; };
type Analysis = { category: string; severity: string; explanation: string; };
type SimilarIssue = { id: string; title: string; description: string; similarity: number; };

// Constants for the form dropdowns
const CATEGORY_OPTIONS = ["Pothole", "Garbage", "Streetlight", "Sewage", "Water Leakage", "Damaged Signage", "Other"];
const SEVERITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

// Zod Schema for the Edit Form
const EditFormSchema = z.object({
  category: z.string(),
  severity: z.string(),
});

export default function IssueDetailClient({ issue: initialIssue }: { issue: Issue }) {
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof EditFormSchema>>({
    resolver: zodResolver(EditFormSchema),
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/analyze-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueId: issue.id }),
        });
        if (!response.ok) throw new Error("Failed to get AI analysis.");
        const result = await response.json();
        setAnalysis(result.analysis);
        setSimilarIssues(result.similarIssues || []);
        form.reset({
          category: result.analysis.category,
          severity: result.analysis.severity,
        });
      } catch (apiError: any) {
        setError(apiError.message);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [issue.id, form]);

  const handleAccept = async () => {
    if (!analysis) return;
    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-issue', {
        method: 'POST', body: JSON.stringify({
          issueId: issue.id, status: 'in_progress',
          category: analysis.category, severity: analysis.severity,
        }),
      });
      if (!response.ok) throw new Error("Failed to update issue.");
      const updatedIssue = await response.json();
      setIssue(updatedIssue);
      toast.success("Issue status updated to 'in_progress'.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveChanges = async (values: z.infer<typeof EditFormSchema>) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-issue', {
        method: 'POST', body: JSON.stringify({
          issueId: issue.id, status: 'in_progress',
          category: values.category, severity: values.severity,
        }),
      });
      if (!response.ok) throw new Error("Failed to save changes.");
      
      const updatedIssue = await response.json();
      setIssue(updatedIssue);
      setAnalysis(prev => prev ? { ...prev, category: values.category, severity: values.severity } : null);
      setIsModalOpen(false);
      toast.success("Issue successfully corrected and updated.");

      // Fire-and-forget feedback logging
      fetch('/api/log-feedback', {
        method: 'POST', body: JSON.stringify({
          issueId: issue.id,
          originalCategory: analysis?.category, originalSeverity: analysis?.severity,
          correctedCategory: values.category, correctedSeverity: values.severity,
        }),
      }).catch(() => { /* ignore logging errors */ });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- ✅ ADDED THIS FUNCTION BACK ---
  const handleSuggestPlan = async () => {
    if (!analysis) return;
    setLoadingPlan(true);
    setError(null);
    setActionPlan(null);

    try {
      const response = await fetch('/api/suggest-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: analysis.category,
          severity: analysis.severity,
        }),
      });

      if (!response.ok) throw new Error("Failed to get action plan.");
      
      const result = await response.json();
      setActionPlan(result.plan);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPlan(false);
    }
  };

  // --- ✅ ADDED THIS FUNCTION BACK ---
  const handleDraftReply = async () => {
    if (!analysis) return;
    setLoadingReply(true);
    setError(null);
    setDraftReply(null);

    try {
      const response = await fetch('/api/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: analysis.category,
          severity: analysis.severity,
          status: issue.status,
        }),
      });

      if (!response.ok) throw new Error("Failed to draft reply.");
      
      const result = await response.json();
      setDraftReply(result.reply);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Original Complaint */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
            <Badge 
              variant={
                issue.status === 'new' ? 'default' :
                issue.status === 'in_progress' ? 'secondary' :
                'outline'
              }
              className={`text-xs font-medium ${
                issue.status === 'new' ? 'bg-blue-600 text-white' : 
                issue.status === 'in_progress' ? 'bg-yellow-400 text-yellow-900' : 
                ''
              }`}
            >
              {issue.status}
            </Badge>
          </div>
          <p className="text-gray-700">{issue.description}</p>
          {issue.img_url && <img src={issue.img_url} alt="Issue evidence" className="rounded-lg max-h-96 w-full object-cover" />}
          <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
            <IssueMap position={[issue.latitude, issue.longitude]} />
          </div>
        </div>

        {/* Right Panel: AI Co-pilot */}
        <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">🤖 AI Co-pilot Analysis</h2>
          {loadingAnalysis && <p>Analyzing...</p>}
          {error && <p className="text-red-500">{error}</p>}
          
          {analysis && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Suggested Category</h3>
                <p className="text-lg font-semibold text-gray-900">{analysis.category}</p>

              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Suggested Severity</h3>
                <p className={`text-lg font-semibold ${analysis.severity === 'High' || analysis.severity === 'Critical' ? 'text-red-600' : 'text-gray-900'}`}>{analysis.severity}</p>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Actions</h3>
                {issue.status === 'new' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAccept}
                      disabled={isUpdating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? 'Accepting...' : 'Accept & Acknowledge'}
                    </Button>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1" disabled={isUpdating}>
                          Edit / Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Correct AI Suggestion</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {CATEGORY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="severity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Severity</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {SEVERITY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">This issue is already '{issue.status}'.</p>
                )}
              </div>

              {/* Reasoning */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reasoning</h3>
                <p className="text-gray-700 italic">"{analysis.explanation}"</p>
              </div>
              
              {/* RAG Context */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Influenced By (RAG Context)</h3>
                <ul className="list-disc list-inside space-y-2 mt-2 text-sm text-gray-600">
                  {similarIssues.length > 0 ? similarIssues.map(si => (
                    <li key={si.id} title={si.description}>#{String(si.id).substring(0, 4)}... {si.title}</li>
                  )) : <li>No similar past issues found.</li>}
                </ul>
              </div>

              {/* AI Tools Section */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-500">AI Tools</h3>
                <div className="space-y-2">
                  <Button onClick={handleSuggestPlan} disabled={loadingPlan || isUpdating} className="w-full">
                    {loadingPlan ? 'Generating Plan...' : 'Suggest Action Plan'}
                  </Button>
                  <Button onClick={handleDraftReply} disabled={loadingReply || isUpdating} variant="secondary" className="w-full">
                    {loadingReply ? 'Drafting Reply...' : 'Draft Formal Reply'}
                  </Button>
                </div>
                {actionPlan && (
                  <div className="p-3 bg-white rounded-md border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Recommended Steps:</h4>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{actionPlan}</pre>
                  </div>
                )}
                {draftReply && (
                  <div className="p-3 bg-white rounded-md border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Suggested Reply Draft:</h4>
                    <Textarea readOnly value={draftReply} className="w-full h-32 font-mono bg-gray-100" />
                    <Button variant="link" size="sm" onClick={() => {
                      navigator.clipboard.writeText(draftReply);
                      toast.success("Reply copied to clipboard!");
                    }} className="p-0 h-auto">
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
