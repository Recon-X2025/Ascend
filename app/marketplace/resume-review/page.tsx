import { Suspense } from "react";
import { ResumeReviewList } from "./ResumeReviewList";

export default function ResumeReviewMarketplacePage() {
  return (
    <div className="page-container page-section">
      <h1 className="text-2xl font-bold mb-2">Resume review</h1>
      <p className="text-muted-foreground mb-6">Get expert feedback on your resume from verified reviewers.</p>
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <ResumeReviewList />
      </Suspense>
    </div>
  );
}
