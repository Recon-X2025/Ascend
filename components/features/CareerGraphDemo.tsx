export function CareerGraphDemo() {
  const nodes = [
    { id: "you", initial: "Y", highlight: true, x: 50, y: 50 },
    { id: "a", initial: "A", x: 20, y: 25 },
    { id: "b", initial: "K", x: 80, y: 25 },
    { id: "c", initial: "R", x: 15, y: 70 },
    { id: "d", initial: "S", x: 85, y: 70 },
    { id: "e", initial: "M", x: 35, y: 15 },
    { id: "f", initial: "P", x: 65, y: 85 },
  ];
  const links = [
    { label: "Colleague at Flipkart", from: "you", to: "a" },
    { label: "Interviewed you", from: "you", to: "b" },
    { label: "Mentor", from: "you", to: "c" },
    { label: "Peer — same cohort", from: "you", to: "d" },
    { label: "Colleague", from: "a", to: "e" },
    { label: "Mentor", from: "d", to: "f" },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-16" style={{ backgroundColor: "var(--bg)" }}>
      <div
        className="relative rounded-xl border mx-auto overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          aspectRatio: "1.4",
          maxWidth: "520px",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-4" preserveAspectRatio="xMidYMid meet">
          {/* Connection lines */}
          <line x1="50" y1="50" x2="20" y2="25" stroke="var(--border-mid)" strokeWidth="0.8" />
          <line x1="50" y1="50" x2="80" y2="25" stroke="var(--border-mid)" strokeWidth="0.8" />
          <line x1="50" y1="50" x2="15" y2="70" stroke="var(--border-mid)" strokeWidth="0.8" />
          <line x1="50" y1="50" x2="85" y2="70" stroke="var(--border-mid)" strokeWidth="0.8" />
          <line x1="20" y1="25" x2="35" y2="15" stroke="var(--border-mid)" strokeWidth="0.6" />
          <line x1="85" y1="70" x2="65" y2="85" stroke="var(--border-mid)" strokeWidth="0.6" />
          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.highlight ? 8 : 5}
                fill={n.highlight ? "var(--green)" : "var(--surface)"}
                stroke="var(--ink)"
                strokeWidth={n.highlight ? 1.5 : 1}
              />
              <text
                x={n.x}
                y={n.y + 1.2}
                textAnchor="middle"
                className="font-body font-semibold fill-ink"
                style={{ fontSize: n.highlight ? "4px" : "3px" }}
              >
                {n.initial}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center">
          {links.slice(0, 4).map((l, i) => (
            <span
              key={i}
              className="font-body text-[0.6rem] px-2 py-0.5 rounded border"
              style={{ color: "var(--ink-3)", borderColor: "var(--border)" }}
            >
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
