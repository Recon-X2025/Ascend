"use client";

import { useState, useRef } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Resume {
  id: string;
  label: string;
  originalName: string;
  fileSize: number;
  visibility: string;
  isDefault: boolean;
}

export function ResumesSection({
  profile,
  onUpdate,
}: {
  profile: { resumes?: Resume[] };
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resumes = (profile.resumes ?? []) as Resume[];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be 5MB or less");
      return;
    }
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, DOC, DOCX allowed");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("label", file.name.replace(/\.[^/.]+$/, ""));
    formData.set("visibility", "RECRUITERS_ONLY");
    const res = await fetch("/api/profile/me/resumes", { method: "POST", body: formData });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) { toast.error("Upload failed"); return; }
    toast.success("Resume uploaded");
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resume?")) return;
    const res = await fetch(`/api/profile/me/resumes/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    onUpdate();
  };

  const handleDownload = (id: string) => {
    window.open(`/api/profile/me/resumes/${id}/download`, "_blank");
  };

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Resumes</h2>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading || resumes.length >= 5}
        />
        <Button
          variant="ghost"
          size="sm"
          className="btn-ghost"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || resumes.length >= 5}
        >
          <Plus className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>
      {resumes.length === 0 ? (
        <p className="text-text-secondary text-sm mt-2">Upload a resume (PDF, DOC, DOCX, max 5MB). Max 5 resumes.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {resumes.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium text-text-primary">{r.label || r.originalName}</p>
                <p className="text-xs text-text-secondary">
                  {(r.fileSize / 1024).toFixed(1)} KB · {r.visibility} {r.isDefault && "· Default"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(r.id)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
