// src/components/ReportIssueForm.tsx
"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";

// ... (Props type definition is the same)
type Props = {
  location: [number, number] | null;
};


export default function ReportIssueForm({ location }: Props) {
  // ... (All your useState hooks are the same)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  // ... (useEffect for image preview is the same)
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);


  // ... (handleFileChange and resetForm are the same)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
  };
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage(null);
    setPreview(null);
    setError(null);
  };


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- ✅ NEW: CLIENT-SIDE VALIDATION ---
    // We check the inputs here before sending anything to the server.
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return;
    }
    if (!location) {
      setError("Location data is not yet available. Please wait.");
      return;
    }
    if (!image) {
      setError("Please select an image for the report.");
      return;
    }
    // --- End of New Validation ---

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", String(location[0]));
    formData.append("longitude", String(location[1]));
    formData.append("file", image);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // This will now catch more specific server errors
        throw new Error(result.error?.fieldErrors?.title?.[0] || result.error?.fieldErrors?.description?.[0] || "An unknown server error occurred.");
      }

      setSuccess("Issue reported successfully! Thank you.");
      resetForm();

    } catch (err: any) {
      setError(err.message);
      console.error("Submission failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- JSX remains the same ---
  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4 max-w-lg mx-auto">
      {/* ... your entire form JSX ... */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Issue Title (e.g., 'Large Pothole')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />

        <textarea
          placeholder="Describe the issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded-md h-24 focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />

        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
          {preview && (
            <div className="h-16 w-16 overflow-hidden rounded-md border-2 border-gray-200">
              <img src={preview} alt="Image preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          📍 {location
            ? `Location: ${location[0].toFixed(5)}, ${location[1].toFixed(5)}`
            : "Waiting for location…"}
        </div>
        
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
        {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !location || !image}
            className="px-5 py-2 rounded-md text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Submitting..." : "Report Issue"}
          </button>
        </div>
      </form>
    </div>
  );
}