// src/components/ComplaintForm.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type Location = { lat: number; lng: number; accuracy?: number } | null;

export default function ComplaintForm({ location }: { location: Location }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const uploadImage = async (f: File) => {
    const filePath = `images/${Date.now()}-${f.name.replace(/\s/g, "_")}`;
    const { data, error } = await supabase.storage.from("issues").upload(filePath, f, { cacheControl: "3600", upsert: false });

    if (error) throw error;
    const { data: urlData } = supabase.storage.from("issues").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("Waiting for location. Allow location access and try again.");
      return;
    }
    setLoading(true);
    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadImage(file);
      }

      const { error } = await supabase.from("issues").insert([
        {
          title,
          description,
          latitude: location.lat,
          longitude: location.lng,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      alert("Issue reported successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit issue: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded shadow-md">
      <input className="w-full border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title (e.g., Pothole near school)" required />
      <textarea className="w-full border p-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail" required />
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview && <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded" />}
      </div>
      <div className="text-sm text-gray-600">
        {location ? (
          <>Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)} (accuracy {location.accuracy ? `${Math.round(location.accuracy)} m` : "unknown"})</>
        ) : (
          <>Waiting for location… (allow location in browser)</>
        )}
      </div>
      <div className="flex gap-2">
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Reporting…" : "Report Issue"}
        </button>
        <button type="button" onClick={() => { setTitle(""); setDescription(""); setFile(null); }} className="px-4 py-2 border rounded">
          Reset
        </button>
      </div>
    </form>
  );
}
