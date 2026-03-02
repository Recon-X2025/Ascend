"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProviderType = "RESUME_REVIEWER" | "MOCK_INTERVIEWER" | "CAREER_COACH";

const SPECIALISATIONS_OPTIONS = [
  "Product Management", "Software Engineering", "Data Science", "Design", "Marketing",
  "Sales", "Finance", "Operations", "HR", "Other",
];

const LANG_OPTIONS = ["en", "hi", "ta", "te", "mr", "bn", "kn", "ml"];
type Step = 1 | 2 | 3;
type Props = { existing: { id: string; status: string } | null };

export function BecomeProviderClient({ existing }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ProviderType>("RESUME_REVIEWER");
  const [bio, setBio] = useState("");
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [pricePerSession, setPricePerSession] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [turnaroundHours, setTurnaroundHours] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");

  const toggleSpecialisation = (s: string) => {
    setSpecialisations((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const toggleLanguage = (l: string) => {
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const handleStep1Next = () => { if (type) { setStep(2); setError(null); } };
  const handleStep2Next = () => {
    if (!bio.trim() || specialisations.length === 0 || languages.length === 0) {
      setError("Bio, at least one specialisation and one language are required.");
      return;
    }
    const price = parseInt(pricePerSession, 10);
    if (!price || price < 1) { setError("Enter a valid price per session."); return; }
    setStep(3);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          bio: bio.trim(),
          specialisations,
          languages,
          pricePerSession: parseInt(pricePerSession, 10),
          currency,
          turnaroundHours: turnaroundHours ? parseInt(turnaroundHours, 10) : undefined,
          calendarUrl: calendarUrl.trim() || undefined,
          linkedInUrl: linkedInUrl.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Submission failed."); return; }
      router.push("/dashboard/provider");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (existing?.status === "PENDING_REVIEW") {
    return (
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Application under review</h2></CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">We will get back to you within 48 hours.</p>
          <Link href="/dashboard"><Button variant="outline">Back to dashboard</Button></Link>
        </CardContent>
      </Card>
    );
  }
  if (existing?.status === "SUSPENDED") {
    return (
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Provider account suspended</h2></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your provider application was not approved. Contact support to reapply.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && <p className="text-sm text-destructive mb-4" role="alert">{error}</p>}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Step 1: Service type</h3>
            <div className="flex flex-wrap gap-2">
              {(["RESUME_REVIEWER", "MOCK_INTERVIEWER", "CAREER_COACH"] as const).map((t) => (
                <Button key={t} type="button" variant={type === t ? "default" : "outline"} size="sm" onClick={() => setType(t)}>
                  {t === "RESUME_REVIEWER" && "Resume Reviewer"}
                  {t === "MOCK_INTERVIEWER" && "Mock Interviewer"}
                  {t === "CAREER_COACH" && "Career Coach"}
                </Button>
              ))}
            </div>
            <div className="flex justify-end pt-4"><Button onClick={handleStep1Next}>Next</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Step 2: Profile and pricing</h3>
            <div>
              <Label htmlFor="bio">Bio (max 500 chars)</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 500))} rows={4} className="mt-1" placeholder="Your experience..." />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
            </div>
            <div>
              <Label>Specialisations</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPECIALISATIONS_OPTIONS.map((s) => (
                  <Button key={s} type="button" variant={specialisations.includes(s) ? "default" : "outline"} size="sm" onClick={() => toggleSpecialisation(s)}>{s}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LANG_OPTIONS.map((l) => (
                  <Button key={l} type="button" variant={languages.includes(l) ? "default" : "outline"} size="sm" onClick={() => toggleLanguage(l)}>{l}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per session</Label>
                <Input id="price" type="number" min={1} value={pricePerSession} onChange={(e) => setPricePerSession(e.target.value)} placeholder={currency === "INR" ? "500" : "10"} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as "INR" | "USD")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {type === "RESUME_REVIEWER" && (
              <div>
                <Label htmlFor="turnaround">Turnaround (hours)</Label>
                <Input id="turnaround" type="number" min={1} value={turnaroundHours} onChange={(e) => setTurnaroundHours(e.target.value)} placeholder="48" />
              </div>
            )}
            {(type === "MOCK_INTERVIEWER" || type === "CAREER_COACH") && (
              <div>
                <Label htmlFor="calendar">Calendly URL</Label>
                <Input id="calendar" type="url" value={calendarUrl} onChange={(e) => setCalendarUrl(e.target.value)} placeholder="https://calendly.com/..." />
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleStep2Next}>Next</Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Step 3: Verification</h3>
            <div>
              <Label htmlFor="linkedin">LinkedIn profile URL (required)</Label>
              <Input id="linkedin" type="url" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <p className="text-sm text-muted-foreground">We will review your application and may ask for additional proof.</p>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading || !linkedInUrl.trim()}>{loading ? "Submitting..." : "Submit application"}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
