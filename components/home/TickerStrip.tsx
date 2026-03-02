"use client";

const TICKER_ITEMS = [
  "Fit Score",
  "Resume Optimiser",
  "Career Graph",
  "Mentorship Network",
  "Salary Insights",
  "26,985 Jobs Indexed",
  "Intelligent Matching",
];

const ROW = TICKER_ITEMS.map((t) => t).join("  ◆  ") + "  ◆  ";
const FULL = ROW + ROW;

export function TickerStrip() {
  return (
    <section
      className="overflow-hidden bg-ink shrink-0"
      style={{
        background: "var(--ink)",
        minHeight: "44px",
        height: "44px",
        overflow: "hidden",
        width: "100%",
      }}
      aria-hidden
    >
      <div
        className="flex h-full items-center whitespace-nowrap text-[0.65rem] tracking-[0.2em] text-white/50 font-body w-[200%]"
        style={{ animation: "ticker 32s linear infinite" }}
      >
        {FULL}
      </div>
    </section>
  );
}
