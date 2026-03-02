export function ResumeOptimiserDemo() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto" style={{ maxWidth: "640px" }}>
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--border)",
          }}
        >
          <p className="font-body text-[0.68rem] tracking-wider uppercase text-ink-4 mb-3">BEFORE</p>
          <p className="font-body text-sm text-ink-3 leading-relaxed">
            Managed product roadmap and worked with teams
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <p className="font-body text-[0.68rem] tracking-wider uppercase text-green font-semibold mb-3">AFTER</p>
          <p className="font-body text-sm text-ink leading-relaxed">
            Led cross-functional roadmap for 3 product lines,{" "}
            <span className="text-green font-medium">reducing time-to-ship by 34%</span>
          </p>
        </div>
      </div>
      <div
        className="mt-6 mx-auto rounded-lg border flex items-center justify-between px-4 py-3"
        style={{
          maxWidth: "640px",
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <span className="font-body text-sm text-ink-3">ATS Score</span>
        <span className="font-display font-bold text-green" style={{ fontSize: "1.25rem" }}>
          82
        </span>
      </div>
    </div>
  );
}
