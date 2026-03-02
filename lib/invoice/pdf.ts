/**
 * GST Invoicing — PDF generation via pdf-lib
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma/client";
import { storeFile } from "@/lib/storage";
import { PLATFORM_ENTITY } from "./config";
import { amountInWords } from "./words";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const LINE_HEIGHT = 14;

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export async function generateInvoicePdf(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "VOID") throw new Error("Cannot generate PDF for void invoice");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let y = PAGE_HEIGHT - MARGIN;

  const draw = (text: string, x: number, size = 10, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 2;
  };

  // Header: TAX INVOICE
  page.drawText("TAX INVOICE", {
    x: MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.06, 0.1, 0.06),
  });
  y -= 24;

  // Seller (left) | Invoice details (right)
  const rightCol = PAGE_WIDTH - MARGIN - 180;
  page.drawText(PLATFORM_ENTITY.legalName, {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= LINE_HEIGHT;

  page.drawText(`GSTIN: ${PLATFORM_ENTITY.gstin}`, { x: MARGIN, y, size: 9, font });
  y -= LINE_HEIGHT;
  page.drawText(PLATFORM_ENTITY.address, { x: MARGIN, y, size: 9, font });
  y -= LINE_HEIGHT;

  const invYStart = y + LINE_HEIGHT * 3;
  let invY = invYStart;
  page.drawText(`Invoice No: ${invoice.invoiceNumber}`, {
    x: rightCol,
    y: invY,
    size: 10,
    font,
  });
  invY -= LINE_HEIGHT;
  page.drawText(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, {
    x: rightCol,
    y: invY,
    size: 10,
    font,
  });
  invY -= LINE_HEIGHT;
  page.drawText(`Due Date: ${formatDate(invoice.invoiceDate)}`, {
    x: rightCol,
    y: invY,
    size: 10,
    font,
  });
  invY -= LINE_HEIGHT;

  y = Math.min(y, invY) - 20;

  // Bill To
  draw("Bill To:", MARGIN, 11, true);
  draw(invoice.payerName, MARGIN);
  if (invoice.payerAddress) draw(invoice.payerAddress, MARGIN);
  draw(invoice.payerEmail, MARGIN);
  if (invoice.payerGstin) draw(`GSTIN: ${invoice.payerGstin}`, MARGIN);
  if (invoice.payerStateCode)
    draw(`State: ${invoice.payerStateCode} (${getStateName(invoice.payerStateCode)})`, MARGIN);
  y -= 16;

  // Line items table
  const colW = {
    num: 25,
    desc: 220,
    sac: 55,
    qty: 35,
    unit: 65,
    amt: 70,
  };
  const tableLeft = MARGIN;
  const headerY = y;
  page.drawText("#", { x: tableLeft, y: headerY, size: 9, font: fontBold });
  page.drawText("Description", { x: tableLeft + colW.num, y: headerY, size: 9, font: fontBold });
  page.drawText("SAC", { x: tableLeft + colW.num + colW.desc, y: headerY, size: 9, font: fontBold });
  page.drawText("Qty", {
    x: tableLeft + colW.num + colW.desc + colW.sac,
    y: headerY,
    size: 9,
    font: fontBold,
  });
  page.drawText("Unit Price", {
    x: tableLeft + colW.num + colW.desc + colW.sac + colW.qty,
    y: headerY,
    size: 9,
    font: fontBold,
  });
  page.drawText("Amount", {
    x: tableLeft + colW.num + colW.desc + colW.sac + colW.qty + colW.unit,
    y: headerY,
    size: 9,
    font: fontBold,
  });
  y -= LINE_HEIGHT + 4;

  invoice.lineItems.forEach((item, i) => {
    const rowY = y;
    page.drawText(String(i + 1), { x: tableLeft, y: rowY, size: 9, font });
    page.drawText(truncate(item.description, 32), {
      x: tableLeft + colW.num,
      y: rowY,
      size: 9,
      font,
    });
    page.drawText(item.sacCode, {
      x: tableLeft + colW.num + colW.desc,
      y: rowY,
      size: 9,
      font,
    });
    page.drawText(String(item.quantity), {
      x: tableLeft + colW.num + colW.desc + colW.sac,
      y: rowY,
      size: 9,
      font,
    });
    page.drawText(formatRupees(item.unitPricePaise), {
      x: tableLeft + colW.num + colW.desc + colW.sac + colW.qty,
      y: rowY,
      size: 9,
      font,
    });
    page.drawText(formatRupees(item.totalPaise), {
      x: tableLeft + colW.num + colW.desc + colW.sac + colW.qty + colW.unit,
      y: rowY,
      size: 9,
      font,
    });
    y -= LINE_HEIGHT;
  });

  y -= 16;

  // Tax summary
  draw("Subtotal:", MARGIN);
  page.drawText(formatRupees(invoice.subtotalPaise), {
    x: rightCol,
    y: y + LINE_HEIGHT,
    size: 10,
    font,
  });
  y -= LINE_HEIGHT;

  if (invoice.gstType === "CGST_SGST") {
    draw("CGST @ 9%:", MARGIN);
    page.drawText(formatRupees(invoice.cgstPaise), {
      x: rightCol,
      y: y + LINE_HEIGHT,
      size: 10,
      font,
    });
    y -= LINE_HEIGHT;
    draw("SGST @ 9%:", MARGIN);
    page.drawText(formatRupees(invoice.sgstPaise), {
      x: rightCol,
      y: y + LINE_HEIGHT,
      size: 10,
      font,
    });
  } else {
    draw("IGST @ 18%:", MARGIN);
    page.drawText(formatRupees(invoice.igstPaise), {
      x: rightCol,
      y: y + LINE_HEIGHT,
      size: 10,
      font,
    });
  }
  y -= LINE_HEIGHT;

  draw("Total:", MARGIN, 12, true);
  page.drawText(formatRupees(invoice.totalPaise), {
    x: rightCol,
    y: y + LINE_HEIGHT + 2,
    size: 12,
    font: fontBold,
  });
  y -= LINE_HEIGHT + 8;

  // Amount in words
  const words = amountInWords(invoice.totalPaise);
  const wordsLines = wrapText(words, 65);
  draw(`Amount in words: ${wordsLines[0] ?? ""}`, MARGIN, 9);
  wordsLines.slice(1).forEach((line) => draw(line, MARGIN, 9));
  y -= 8;

  // Footer
  y = MARGIN + 60;
  page.drawText("This is a computer-generated invoice and does not require a signature.", {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= LINE_HEIGHT;
  page.drawText(`SAC Code: ${PLATFORM_ENTITY.sacCode} — Online information and database retrieval services`, {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= LINE_HEIGHT;
  page.drawText("Powered by Ascend | ascend.app", {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line.length + w.length + 1 > maxLen && line) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function getStateName(code: string): string {
  const states: Record<string, string> = {
    "01": "Jammu & Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu",
    "27": "Maharashtra",
    "28": "Andhra Pradesh",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
  };
  return states[code] ?? code;
}

export async function uploadInvoicePdf(invoiceId: string, buffer: Buffer): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { financialYear: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  const key = `invoices/${invoice.financialYear}/${invoiceId}.pdf`;
  await storeFile(key, buffer, "application/pdf");
  return key;
}
