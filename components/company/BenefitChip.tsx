interface BenefitChipProps {
  label: string;
  icon?: string | null;
  avgRating?: number | null;
}

export function BenefitChip({ label, icon, avgRating }: BenefitChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      {icon ? <span className="text-lg">{icon}</span> : null}
      <span>{label}</span>
      {avgRating != null ? <span className="text-muted-foreground text-xs">★ {avgRating}</span> : null}
    </div>
  );
}
