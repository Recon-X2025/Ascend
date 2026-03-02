"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = "image/jpeg,image/png,application/pdf";

interface DocInfo {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  accepted: boolean | null;
}

interface DocumentUploadZoneProps {
  label: string;
  documentType: "GOVERNMENT_ID" | "EMPLOYMENT_PROOF";
  existingDocs: DocInfo[];
  onUploadComplete: () => void;
}

export function DocumentUploadZone({
  label,
  documentType,
  existingDocs,
  onUploadComplete,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      setError("File must be JPEG, PNG, or PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File must be 5MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", documentType);
      const res = await fetch("/api/mentorship/verification/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onUploadComplete();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-medium text-ink mb-2">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
      {existingDocs.length > 0 ? (
        <div className="space-y-2">
          {existingDocs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 text-sm text-ink-3"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>{d.fileName}</span>
              <span className="text-xs">
                {new Date(d.uploadedAt).toLocaleDateString()}
                {d.accepted === true && " · Accepted"}
                {d.accepted === false && " · Rejected"}
                {d.accepted === null && " · Pending review"}
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-green hover:underline disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Add another
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-ink-3 mb-2" />
          ) : (
            <Upload className="h-8 w-8 text-ink-3 mb-2" />
          )}
          <span className="text-sm text-ink-3">PDF, JPG or PNG. Max 5MB.</span>
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
