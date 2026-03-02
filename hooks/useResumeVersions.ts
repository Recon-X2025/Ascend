import { useState, useEffect, useCallback } from "react";

interface ResumeVersion {
  id: string;
  name: string;
  createdAt: string;
  jobPostId: number | null;
}

interface VersionsResponse {
  success: boolean;
  data: ResumeVersion[];
  meta?: { count: number; maxVersions: number; limitReached: boolean };
}

export function useResumeVersions(options: { baseOnly?: boolean } = {}) {
  const { baseOnly = false } = options;
  const url = baseOnly ? "/api/resume/versions?baseOnly=true" : "/api/resume/versions";

  const [data, setData] = useState<VersionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch");
      setData(json);
      return json;
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const versions = data?.success ? (data.data ?? []) : [];
  return {
    versions,
    isLoading,
    error,
    refetch: fetchVersions,
  };
}
