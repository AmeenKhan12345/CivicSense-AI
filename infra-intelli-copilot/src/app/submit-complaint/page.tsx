// src/app/submit-complaint/page.tsx
"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import dynamic from 'next/dynamic';

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner"; // Using Toaster for notifications

// Dynamically import the map for selection (optional, but good for UX)
const IssueMap = dynamic(() => import('@/components/IssueMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-200 flex items-center justify-center"><p>Loading map...</p></div>
});

export default function SubmitComplaintPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState<[number, number] | null>([21.1458, 79.0882]); // Default to Nagpur
  
  const [loading, setLoading] = useState(false);

  // Get user's location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        console.warn("Could not get user location, using default.");
      }
    );
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error("Location data is not yet available. Please wait.");
      return;
    }
    if (!image) {
      toast.error("Please select an image for the report.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", String(location[0]));
    formData.append("longitude", String(location[1]));
    formData.append("file", image);

    try {
      // It calls the same API route we've already built!
      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "An unknown error occurred.");
      }

      toast.success("Complaint submitted successfully! An officer will review it shortly.");
      resetForm();

    } catch (err: any) {
      toast.error(err.message);
      console.error("Submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Submit a New Complaint</CardTitle>
            <CardDescription>Fill out the form below to report a civic issue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., 'Large Pothole on Main St'"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Upload Image</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                  {location ? (
                    <IssueMap position={location} />
                  ) : (
                    <p>Loading map...</p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}