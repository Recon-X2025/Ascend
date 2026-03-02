"use client";

const letters = [
  { char: "A", color: "var(--ink)", marginBottom: 0 },
  { char: "S", color: "var(--ink)", marginBottom: 8 },
  { char: "C", color: "var(--ink)", marginBottom: 16 },
  { char: "E", color: "var(--ink)", marginBottom: 24 },
  { char: "N", color: "var(--ink)", marginBottom: 32 },
  { char: "D", color: "var(--green)", marginBottom: 40 },
];

export function AscendLogotype() {
  return (
    <div
      className="w-full"
      style={{
        display: "flex",
        alignItems: "flex-end",
        position: "relative",
        gap: "0.05em",
      }}
    >
      {letters.map((l) => (
        <div
          key={l.char}
          style={{
            marginBottom: l.marginBottom,
            lineHeight: 1,
          }}
        >
          <span
            className="font-display font-extrabold leading-none block"
            style={{
              color: l.color,
              fontSize: "clamp(3rem, 10vw, 9rem)",
              letterSpacing: "-0.01em",
            }}
          >
            {l.char}
          </span>
        </div>
      ))}
      <span
        className="absolute left-0 bottom-[-8px] h-px w-full bg-green"
        aria-hidden
      />
    </div>
  );
}
