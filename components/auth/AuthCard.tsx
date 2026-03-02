import Link from "next/link";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showBrand?: boolean;
}

export function AuthCard({ title, description, children, showBrand = true }: AuthCardProps) {
  return (
    <div className="w-full max-w-[380px] mx-4 bg-surface border border-border rounded-2xl p-9 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
      {showBrand && (
        <Link
          href="/"
          className="mb-6 flex flex-col items-center font-display font-extrabold text-[1.15rem] text-ink"
        >
          Ascend
          <span className="font-body text-[0.58rem] font-normal tracking-[0.2em] uppercase text-ink-4 mt-0.5">
            A Coheron Product
          </span>
        </Link>
      )}
      <div className="space-y-1 text-center mb-6">
        <h1 className="font-display font-bold text-[1.25rem] text-ink">{title}</h1>
        {description && (
          <p className="font-body text-[0.85rem] text-ink-3">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
