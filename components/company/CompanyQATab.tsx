"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CompanyQATab({ slug }: { slug: string }) {
  const [data, setData] = useState<{ questions: Array<{ id: string; question: string; answer: string | null; answeredBy: string | null; upvotes: number; downvotes: number; createdAt: string }>; totalCount: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/companies/${slug}/qa?page=${page}&limit=10`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [slug, page]);
  useEffect(() => { load(); }, [load]);

  const ask = async () => {
    if (!question.trim() || question.trim().length < 10) return;
    setSubmitting(true);
    const res = await fetch(`/api/companies/${slug}/qa`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question.trim() }) });
    setSubmitting(false);
    if (res.ok) { setQuestion(""); setAskOpen(false); load(); }
  };

  if (loading || !data) return <p className="mt-6 text-muted-foreground">Loading...</p>;
  const totalPages = Math.ceil(data.totalCount / 10) || 1;
  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Q&A</h2>
        <Button onClick={() => setAskOpen((o) => !o)}>Ask a Question</Button>
      </div>
      {askOpen && (
        <Card><CardContent className="pt-6">
          <textarea className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Your question (min 10 chars)" />
          <Button className="mt-2" onClick={ask} disabled={submitting || question.trim().length < 10}>{submitting ? "Submitting..." : "Submit"}</Button>
        </CardContent></Card>
      )}
      <div className="space-y-4">
        {data.questions.map((q) => (
          <Card key={q.id}><CardContent className="pt-6">
            <p className="font-medium">{q.question}</p>
            {q.answer && <p className="mt-2 text-sm text-muted-foreground">Answered by {q.answeredBy ?? "Company"}</p>}
            {q.answer && <p className="mt-1">{q.answer}</p>}
            <div className="flex gap-2 mt-2 text-sm"><span>↑ {q.upvotes}</span><span>↓ {q.downvotes}</span></div>
          </CardContent></Card>
        ))}
      </div>
      {totalPages > 1 && <div className="flex justify-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}
    </div>
  );
}
