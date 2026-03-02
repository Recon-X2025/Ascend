"use client";

import { useRef, useEffect, useState } from "react";

export function FitScoreDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState(0);
  const target = 94;
  const duration = 1400;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const startTime = performance.now();
    const step = (t: number) => {
      const elapsed = t - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScore(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
      else setScore(target);
    };
    requestAnimationFrame(step);
  }, [visible]);

  return (
    <div ref={ref} className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
      <div
        className="rounded-xl border p-6 mx-auto"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          maxWidth: "420px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-ink" style={{ fontSize: "1.1rem" }}>
              Senior Product Manager
            </p>
            <p className="font-body text-ink-3 text-sm mt-0.5">Zepto · Mumbai</p>
          </div>
          <div
            className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-display font-extrabold text-white"
            style={{
              backgroundColor: "var(--green)",
              fontSize: "1.5rem",
            }}
          >
            {score}
          </div>
        </div>
        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <div className="flex justify-between font-body text-sm">
            <span className="text-ink-3">Skills match</span>
            <span className="text-ink font-medium">28/30</span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-ink-3">Experience</span>
            <span className="text-ink font-medium">22/25</span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-ink-3">Keywords</span>
            <span className="text-ink font-medium">13/15</span>
          </div>
        </div>
      </div>
    </div>
  );
}
