"use client";

import { useRef, useEffect, useState } from "react";

const FEATURES = [
  { num: "01", name: "Fit Score", desc: "Know exactly how well you match before applying. A 100-point model with full breakdown." },
  { num: "02", name: "Resume Optimiser", desc: "Tailored to every JD. The gap between your profile and the role — identified, explained, closed." },
  { num: "03", name: "Career Graph", desc: "A network built around where you're going. Context-anchored connections." },
  { num: "04", name: "Mentorship", desc: "People further along the path, helping you navigate yours. India to global." },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState<number[]>([0, 1, 2, 3]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          setVisible((v) => (v.includes(idx) ? v : [...v, idx].sort((a, b) => a - b)));
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );
    el.querySelectorAll("[data-idx]").forEach((child) => obs.observe(child));
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="pt-[80px] pb-16 px-6 md:px-12 max-w-[1280px] mx-auto">
      <p className="font-body text-[0.68rem] tracking-[0.22em] uppercase text-green mb-4">
        What Ascend does differently
      </p>
      <h2 className="font-display font-bold text-ink leading-tight mb-16 text-[clamp(1.8rem,3.5vw,2.8rem)]">
        Not just a job board. A career intelligence platform.
      </h2>
      <div className="border-t border-border">
        {FEATURES.map((f, i) => (
          <div
            key={f.num}
            data-idx={i}
            className="grid grid-cols-[72px_1fr_32px] gap-7 py-7 pl-5 border-b border-border border-l-[3px] border-l-transparent hover:border-l-green hover:bg-[var(--green-tint)] transition-all duration-200 cursor-pointer group"
            style={{
              opacity: visible.includes(i) ? 1 : 0,
              transform: visible.includes(i) ? "translateY(0)" : "translateY(20px)",
              transitionDelay: visible.includes(i) ? `${i * 80}ms` : "0ms",
            }}
          >
            <span className="font-display font-extrabold text-[3rem] text-ink-5 group-hover:text-green-mid leading-none">
              {f.num}
            </span>
            <div>
              <h3 className="font-display font-bold text-[1.05rem] text-ink mb-1.5">{f.name}</h3>
              <p className="font-body text-[0.875rem] text-ink-3 leading-[1.75] max-w-[540px]">{f.desc}</p>
            </div>
            <span className="text-ink-5 group-hover:text-green group-hover:translate-x-1 transition-all text-[1.1rem]">
              →
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
