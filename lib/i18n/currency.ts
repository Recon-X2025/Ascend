/**
 * Phase 21: Currency formatting and conversion.
 * Exchange rates are static env vars; label all non-INR conversions as approximate.
 */

export const SUPPORTED_CURRENCIES: Record<
  string,
  { symbol: string; locale: string; decimals: number }
> = {
  INR: { symbol: "₹", locale: "en-IN", decimals: 0 },
  USD: { symbol: "$", locale: "en-US", decimals: 0 },
  EUR: { symbol: "€", locale: "de-DE", decimals: 0 },
  BRL: { symbol: "R$", locale: "pt-BR", decimals: 0 },
  GBP: { symbol: "£", locale: "en-GB", decimals: 0 },
  AED: { symbol: "AED", locale: "ar-AE", decimals: 0 },
  SGD: { symbol: "S$", locale: "en-SG", decimals: 0 },
};

/** Static rates: 1 INR = X in target. Load from env (e.g. EXCHANGE_RATE_USD_INR = 0.012). */
function getRateToInr(currency: string): number | null {
  const key = `EXCHANGE_RATE_${currency}_INR`;
  const raw = process.env[key];
  if (raw == null) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/** Convert amount in INR to target currency (rate = units of target per 1 INR). */
export function convertFromInr(amountInr: number, toCurrency: string): number {
  if (toCurrency === "INR") return amountInr;
  const rate = getRateToInr(toCurrency);
  if (rate == null) return amountInr; // fallback: no conversion
  return amountInr * rate;
}

/**
 * Format amount (stored in INR) in user's preferred currency.
 * If converted, pass approximate: true so UI can append "(approx.)".
 */
export function formatCurrency(
  amountInr: number,
  currency: string,
  options?: { approximate?: boolean; compact?: boolean }
): string {
  const config = SUPPORTED_CURRENCIES[currency];
  const locale = config?.locale ?? "en-IN";
  const decimals = config?.decimals ?? 0;

  let amount = amountInr;
  if (currency !== "INR") {
    const rate = getRateToInr(currency);
    if (rate != null) {
      amount = amountInr * rate;
    }
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency === "INR" ? "INR" : currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(options?.compact ? { notation: "compact" as const } : {}),
  });
  const str = formatter.format(amount);
  if (options?.approximate && currency !== "INR") {
    return `${str} (approx.)`;
  }
  return str;
}

/** Format salary range. For INR shows LPA (lakhs); other currencies use full amount. */
export function formatSalaryRange(
  salaryMinInr: number | null,
  salaryMaxInr: number | null,
  currency: string,
  options?: { approximate?: boolean }
): string {
  if (salaryMinInr == null && salaryMaxInr == null) return "";
  const approx = currency !== "INR";
  const suffix = currency === "INR" ? " LPA" : "";
  if (currency === "INR") {
    const minL = salaryMinInr != null ? salaryMinInr / 100000 : null;
    const maxL = salaryMaxInr != null ? salaryMaxInr / 100000 : null;
    if (minL != null && maxL != null) return `₹${minL} – ₹${maxL}${suffix}`;
    if (minL != null) return `₹${minL}+${suffix}`;
    if (maxL != null) return `Up to ₹${maxL}${suffix}`;
    return "";
  }
  if (salaryMinInr != null && salaryMaxInr != null) {
    const min = formatCurrency(salaryMinInr, currency, { approximate: approx && options?.approximate });
    const max = formatCurrency(salaryMaxInr, currency, { approximate: false });
    return `${min} – ${max}`;
  }
  if (salaryMinInr != null) {
    return formatCurrency(salaryMinInr, currency, { approximate: approx && options?.approximate }) + "+";
  }
  if (salaryMaxInr != null) {
    return "Up to " + formatCurrency(salaryMaxInr, currency, { approximate: approx && options?.approximate });
  }
  return "";
}
