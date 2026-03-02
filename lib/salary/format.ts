/**
 * Phase 8: Format salary for display — ₹XL/yr or ₹X Cr/yr
 */
export function formatSalaryLPA(value: number): string {
  if (value >= 1e7) {
    const cr = value / 1e7;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr/yr`;
  }
  const l = value / 1e5;
  return `₹${l % 1 === 0 ? l : l.toFixed(1)}L/yr`;
}

export function formatSalaryShort(value: number): string {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)} Cr`;
  return `₹${(value / 1e5).toFixed(0)}L`;
}
