"use client";

import { AscendLogotype } from "./AscendLogotype";
import { SearchBar } from "./SearchBar";

const FLOATING_CARDS = [
  { role: "Senior Product Manager", meta: "Razorpay · Bangalore", fit: "94% fit", top: "20px",   left: "30%",  delay: 0   },
  { role: "Staff Engineer",         meta: "Zepto · Mumbai",       fit: "87% fit", bottom: "40px", left: "2%",   delay: 0.8 },
  { role: "Data Scientist",         meta: "PhonePe · Remote",     fit: "91% fit", top: "42%",     left: "55%",  delay: 1.6 },
];

export function HeroSection() {
  return (
    <>
      <style>{`
        @keyframes heroSpin  { to { transform: rotate(360deg); } }
        @keyframes heroFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-x-hidden w-full max-w-[100vw]">
        <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-0 lg:gap-20 items-center">

          {/* Left column */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="font-body text-[11px] tracking-[0.2em] uppercase text-green mb-8">
              A COHERON PRODUCT
            </p>
            <AscendLogotype />
            <p className="font-display font-normal text-[1.4rem] text-ink-2 mt-8 max-w-[520px] leading-snug">
              Your career has a direction. We make it inevitable.
            </p>
            <p className="font-body text-xs text-ink-3 tracking-[0.1em] mt-4">
              Intelligent matching, Fit score, Resume optimiser
            </p>
            <div className="mt-10 w-full max-w-[520px]">
              <SearchBar />
            </div>
            <div className="mt-12 text-ink-3 opacity-40 animate-bounce-cue lg:hidden" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Right column — geometric visual + floating cards (desktop only); hidden at <1024px */}
          <div
            className="hidden lg:block relative flex-shrink-0"
            style={{ width: "480px", height: "480px", overflow: "hidden" }}
          >
            {/* Large green circle — centred within column */}
            <div
                className="absolute rounded-full"
                style={{
                  width: "320px",
                  height: "320px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "var(--green-light)",
                  border: "1.5px solid var(--green-mid)",
                }}
              />
              {/* Rotating dashed ring */}
              <div
                className="absolute rounded-full border border-dashed"
                style={{
                  width: "230px",
                  height: "230px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  borderColor: "rgba(22,163,74,0.3)",
                  animation: "heroSpin 20s linear infinite",
                }}
              />
              {/* Green centre dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: "10px",
                  height: "10px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "var(--green)",
                  boxShadow: "0 0 16px rgba(22,163,74,0.4)",
                }}
              />
            {/* Floating job match cards — all positioned within 480×480 bounds */}
            {FLOATING_CARDS.map((card, i) => (
              <div
                key={i}
                className="absolute bg-surface rounded-xl border border-border shadow-card-hover py-3 px-4"
                style={{
                  top: card.top,
                  bottom: card.bottom,
                  left: card.left,
                  maxWidth: "185px",
                  animation: "heroFloat 5.5s ease-in-out infinite",
                  animationDelay: `${card.delay}s`,
                  animationFillMode: "both",
                }}
              >
                <p className="font-display font-semibold text-[0.85rem] text-ink leading-tight">{card.role}</p>
                <p className="font-body text-[0.75rem] text-ink-3 mt-0.5">{card.meta}</p>
                <span
                  className="inline-block mt-2 font-body font-medium text-[0.72rem] px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: "var(--green-light)",
                    borderColor: "var(--green-mid)",
                    color: "var(--green-dark)",
                  }}
                >
                  {card.fit}
                </span>
              </div>
            ))}
          </div>

        </div>

        <div className="hidden lg:block mt-12 text-ink-3 opacity-40 animate-bounce-cue" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>
    </>
  );
}
