/**
 * Indian Rupees amount in words — for invoice PDF "Amount in words"
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const TEENS = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

function toHundreds(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ONES[Math.floor(n / 100)], "Hundred");
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
  } else if (n >= 10) {
    parts.push(TEENS[n - 10]);
    n = 0;
  }
  if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}

/** Convert integer (up to ~99 crores) to words */
export function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const hund = n % 1e3;
  if (crore > 0) parts.push(toHundreds(crore), "Crore");
  if (lakh > 0) parts.push(toHundreds(lakh), "Lakh");
  if (thousand > 0) parts.push(toHundreds(thousand), "Thousand");
  if (hund > 0) parts.push(toHundreds(hund));
  return parts.filter(Boolean).join(" ");
}

/** Format totalPaise as "Rupees X and Y Paise Only" or "Rupees X Only" */
export function amountInWords(totalPaise: number): string {
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const rupeeWords = numberToWords(rupees);
  const paiseWords = paise > 0 ? numberToWords(paise) : "";
  if (paiseWords) {
    return `Rupees ${rupeeWords} and ${paiseWords} Paise Only`;
  }
  return `Rupees ${rupeeWords} Only`;
}
