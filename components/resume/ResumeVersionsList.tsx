"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Pencil,
  Copy,
  Download,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type JobPost = { id: number; title: string | null; companyName: string | null; companyId: string | null } | null;
type CareerIntent = { id: string; targetRole: string; targetIndustry: string };

export interface ResumeVersionItem {
  id: string;
  name: string;
  templateId: string | null;
  atsScore: number | null;
  lastUsedAt: string | null;
  updatedAt: string;
  status: "DRAFT" | "COMPLETE";
  isDefault: boolean;
  careerIntent: CareerIntent;
  jobPost: JobPost;
  applicationCount?: number;
}

interface ListResponse {
  success: boolean;
  data: ResumeVersionItem[];
  meta: {
    plan: string;
    count: number;
    maxVersions: number;
    limitReached: boolean;
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ResumeVersionsList() {
  const [versions, setVersions] = useState<ResumeVersionItem[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume/versions");
      const json = await res.json();
      if (json.success) {
        setVersions(json.data ?? []);
        setMeta(json.meta ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const setDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/resume/versions/${id}/set-default`, { method: "POST" });
      if (res.ok) await fetchVersions();
    } catch {
      // ignore
    }
  };

  const duplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/resume/versions/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) await fetchVersions();
      else {
        const json = await res.json();
        alert(json.message ?? json.error ?? "Could not duplicate");
      }
    } catch {
      alert("Could not duplicate");
    }
  };

  const deleteVersion = async (id: string, applicationCount: number) => {
    if (deletingId) return;
    const message =
      applicationCount > 0
        ? `This resume was used for ${applicationCount} application(s). Deleting will not affect past applications but the version will no longer be available. Are you sure you want to delete?`
        : "Are you sure you want to delete this resume version?";
    if (!window.confirm(message)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resume/versions/${id}`, { method: "DELETE" });
      if (res.ok) await fetchVersions();
      else {
        const json = await res.json();
        alert(json.error ?? "Could not delete");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading resume versions…</p>
      </div>
    );
  }

  const limitReached = meta?.limitReached ?? false;
  const count = meta?.count ?? 0;
  const maxVersions = meta?.maxVersions ?? 5;
  const isFree = meta?.plan === "free";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Resume versions</h1>
        <Link href="/resume/build">
          <Button disabled={limitReached} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Resume
          </Button>
        </Link>
      </div>

      {isFree && (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          You&apos;ve used {count}/{maxVersions} versions. Upgrade to Premium for unlimited.
        </p>
      )}

      {versions.length === 0 ? (
        <Card className="ascend-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No resume versions yet. Create one from the builder.
            </p>
            <Link href="/resume/build">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {versions.map((v) => (
            <Card key={v.id} className="ascend-card overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {v.isDefault && (
                    <Star className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" aria-label="Default resume" />
                  )}
                  <CardTitle className="text-base truncate">{v.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Actions" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!v.isDefault && (
                      <DropdownMenuItem onClick={() => setDefault(v.id)}>
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/resume/build?careerIntentId=${v.careerIntent.id}`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(v.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/api/resume/export?versionId=${encodeURIComponent(v.id)}&format=pdf`} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/api/resume/export?versionId=${encodeURIComponent(v.id)}&format=docx`} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download DOCX
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteVersion(v.id, v.applicationCount ?? 0)}
                      disabled={!!deletingId}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-sm text-muted-foreground">
                  {v.careerIntent.targetRole}
                  {v.careerIntent.targetIndustry ? ` · ${v.careerIntent.targetIndustry}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      v.status === "COMPLETE"
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {v.status}
                  </span>
                  {v.atsScore != null && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      ATS {v.atsScore}
                    </span>
                  )}
                  {v.jobPost && (v.jobPost.companyName || v.jobPost.title) && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      Optimised for {v.jobPost.companyName ?? "Job"}
                      {v.jobPost.title ? " — " + v.jobPost.title : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Updated {formatDate(v.updatedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

