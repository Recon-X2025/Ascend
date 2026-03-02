import "./legal.css";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-[980px] mx-auto py-20 px-6 grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8 items-start">
        {children}
      </div>
    </div>
  );
}
