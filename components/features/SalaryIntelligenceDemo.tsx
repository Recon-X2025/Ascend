export function SalaryIntelligenceDemo() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
      <div
        className="rounded-xl border p-6 mx-auto"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          maxWidth: "520px",
        }}
      >
        <p className="font-body text-ink-3 text-sm mb-4">
          Product Manager · Bangalore · 4–7 years exp
        </p>
        <div className="relative h-10 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: "55%",
              backgroundColor: "var(--green)",
              opacity: 0.4,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
            style={{ left: "42%", backgroundColor: "var(--green)" }}
            title="Median"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
            style={{ left: "55%", backgroundColor: "var(--surface-2)", borderColor: "var(--border-mid)" }}
            title="You are here"
          />
        </div>
        <div className="flex justify-between mt-2 font-body text-xs text-ink-3">
          <span>₹18L</span>
          <span>₹28L (Median)</span>
          <span>₹42L</span>
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2 font-body text-sm">
          <p className="text-ink-2">
            <span className="text-ink-3">Top payer:</span> Zepto ₹38L
          </p>
          <p className="text-ink-2">
            <span className="text-ink-3">Market range:</span> ₹18L – ₹42L
          </p>
        </div>
        <p className="mt-2 font-body text-xs text-ink-4 italic">
          You are here: ₹34L
        </p>
      </div>
    </div>
  );
}
