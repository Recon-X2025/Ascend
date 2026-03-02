export default function MarketplaceCoursesPage() {
  return (
    <div className="page-container page-section">
      <h1 className="text-2xl font-bold mb-2">Course recommendations</h1>
      <p className="text-muted-foreground mb-6">Browse courses to close your skills gap. Filter by skill, provider, level.</p>
      <p className="text-muted-foreground">List via GET /api/marketplace/courses</p>
    </div>
  );
}
