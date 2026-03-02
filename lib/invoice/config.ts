/**
 * GST Invoicing — platform entity config (Coheron Tech Private Limited)
 */

export const PLATFORM_ENTITY = {
  legalName: "Coheron Tech Private Limited",
  tradeName: "Ascend",
  gstin: "29AANCC3402A1Z3",
  stateCode: "29",
  state: "Karnataka",
  address: "No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru, Karnataka – 560037",
  email: "billing@ascend.app",
  gstRate: 0.18,
  sacCode: "998314",
} as const;

/** Indian financial year: April 1 → March 31 */
export function getFinancialYear(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}
