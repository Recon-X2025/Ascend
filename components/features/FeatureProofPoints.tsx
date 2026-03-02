interface ProofPoint {
  icon: string;
  label: string;
  description: string;
}

interface FeatureProofPointsProps {
  points: ProofPoint[];
}

export function FeatureProofPoints({ points }: FeatureProofPointsProps) {
  return (
    <section
      className="py-20"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        {points.map((point, i) => (
          <div key={i}>
            <p
              className="font-body mb-2"
              style={{
                color: "var(--green)",
                fontSize: "1.25rem",
                fontWeight: 500,
              }}
            >
              {point.icon}
            </p>
            <h3
              className="font-display font-semibold mb-2"
              style={{
                fontSize: "1rem",
                color: "var(--ink)",
              }}
            >
              {point.label}
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: "0.9rem",
                color: "var(--ink-3)",
                lineHeight: 1.7,
              }}
            >
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
