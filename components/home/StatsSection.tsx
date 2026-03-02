"use client";

import { useRef, useEffect, useState } from "react";

const STATS = [
  { value: 26985, suffix: "+", label: "Jobs Indexed" },
  { value: 500, suffix: "+", label: "Companies Tracked" },
  { value: 10, suffix: "", label: "Industries Covered" },
];

function useCountUp(trigger: boolean, value: number, duration = 1800) {
  const start = Math.floor(value * 0.82);
  const [count, setCount] = useState(start);
  useEffect(() => {
    if (!trigger) return;
    const startTime = performance.now();
    const step = (t: number) => {
      const elapsed = t - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(start + progress * (value - start)));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(value);
    };
    requestAnimationFrame(step);
  }, [trigger, value, duration, start]);
  return count;
}

function StatBlock({
  value,
  suffix,
  label,
  trigger,
  last,
}: {
  value: number;
  suffix: string;
  label: string;
  trigger: boolean;
  last: boolean;
}) {
  const count = useCountUp(trigger, value);
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0 16px",
        borderRight: last ? "none" : "1px solid #e2e0d8",
        overflow: "hidden",
        minWidth: 0,
        width: "100%",
      }}
    >
      <p
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "2.5rem",
          color: "#16A34A",
          lineHeight: 1,
          marginBottom: "10px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {count.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#9b9b8e",
          fontFamily: "DM Sans, sans-serif",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setTrigger(true),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        backgroundColor: "var(--bg, #F7F6F1)",
        borderBottom: "1px solid #e2e0d8",
        padding: "80px 48px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          maxWidth: "680px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {STATS.map((s, i) => (
          <StatBlock
            key={s.label}
            trigger={trigger}
            last={i === STATS.length - 1}
            {...s}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.68rem",
          color: "#b0ae9f",
          fontStyle: "italic",
          textAlign: "center",
          marginTop: "36px",
        }}
      >
        Numbers reflect our indexed job corpus. Live platform data updates post-launch.
      </p>
    </section>
  );
}
