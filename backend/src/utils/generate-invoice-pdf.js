import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export function invoiceFileName(order) {
  return `Estimate-${order.orderId}.pdf`;
}

// ── Number → Indian words ─────────────────────────────────────────
function numberToWords(num) {
  num = Math.floor(num);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20)  return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000)    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000)  return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

// ── Layout constants ──────────────────────────────────────────────
const PAGE_W  = 595;
const PAGE_H  = 842;  // A4 in points
const MX      = 40;   // horizontal margin
const W       = PAGE_W - MX * 2; // 515 usable width

// Footer
const FOOTER_H = 70;
const FOOTER_Y = PAGE_H - FOOTER_H; // 772

// First-page fixed sections
const HEADER_H   = 110; // navy bar
const META_H     = 38;  // gold bar
const ADDR_TOP   = HEADER_H + META_H + 20; // 168
const ADDR_H     = 95;
const TABLE_TOP_P1 = ADDR_TOP + ADDR_H + 20; // 283

// Table row
const TABLE_HDR_H = 24;
const ROW_H       = 26;

// Summary block (drawn after the last row on each final page)
const SUMMARY_H   = 80;
const SUMMARY_GAP = 20;

// Continuation-page mini-header
const CONT_HDR_H    = 50;
const TABLE_TOP_CONT = CONT_HDR_H;

// Column x-positions
const C = { num: 40, name: 65, code: 220, hsn: 290, qty: 355, unit: 390, price: 430, amount: 480 };

// Max rowY at which we're still allowed to start a new item row:
// after the row we need room for: total row + summary gap + summary + gap to footer
const ROW_BREAK_Y = FOOTER_Y - ROW_H - SUMMARY_GAP - SUMMARY_H - SUMMARY_GAP;
//                = 772   - 26   - 20           - 80          - 20  = 626

// ── Section drawers ───────────────────────────────────────────────
const NAVY  = '#1B3A6B';
const GOLD  = '#C9A84C';
const LIGHT = '#EEF1F8';
const DARK  = '#1A1A2E';
const GRAY  = '#6B7280';

function drawFirstPageHeader(doc, order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Navy header bar
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);

  // Logo (optional)
  const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try { doc.image(logoPath, 40, 15, { height: 75 }); } catch {}
  }

  // Company name & tagline
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
    .text('ADIYOGI INTERNATIONAL', 0, 28, { align: 'right', width: 555 });
  doc.fontSize(10).font('Helvetica-Oblique').fillColor(GOLD)
    .text('"Come Experience the Quality"', 0, 55, { align: 'right', width: 555 });
  doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
    .text('Tax Invoice', 0, 72, { align: 'right', width: 555 });

  // Gold meta bar
  doc.rect(0, HEADER_H, PAGE_W, META_H).fill(GOLD);
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
    .text(`ESTIMATE: ${order.orderId}`, 40, 122);
  doc.fontSize(11).font('Helvetica')
    .text(`Date: ${date}   |   Payment: ${order.paymentMode}`, 0, 124, { align: 'right', width: 555 });

  // Address boxes
  doc.rect(40, ADDR_TOP, 230, ADDR_H).fill(LIGHT).stroke();
  doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('FROM:', 52, ADDR_TOP + 10);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Adiyogi International', 52, ADDR_TOP + 24);
  doc.fontSize(9).font('Helvetica').fillColor(GRAY)
    .text('India', 52, ADDR_TOP + 38)
    .text('GSTIN: Applied For', 52, ADDR_TOP + 52);

  doc.rect(285, ADDR_TOP, 270, ADDR_H).fill(LIGHT).stroke();
  doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('BILL TO:', 297, ADDR_TOP + 10);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(order.customer.name, 297, ADDR_TOP + 24);
}

function drawContinuationHeader(doc, order) {
  doc.rect(0, 0, PAGE_W, CONT_HDR_H).fill(NAVY);
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
    .text('ADIYOGI INTERNATIONAL', 40, 14);
  doc.fillColor(GOLD).fontSize(9).font('Helvetica')
    .text(`ESTIMATE: ${order.orderId}  (continued)`, 0, 14, { align: 'right', width: 555 });
  doc.fillColor('#CBD5E1').fontSize(8).font('Helvetica')
    .text('Tax Invoice', 0, 30, { align: 'right', width: 555 });
}

/** Draws the table column header row and returns the y of the first data row. */
function drawTableHeader(doc, tTop) {
  doc.rect(MX, tTop, W, TABLE_HDR_H).fill(NAVY);
  doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
  doc.text('#',         C.num,    tTop + 8);
  doc.text('Item Name', C.name,   tTop + 8);
  doc.text('Code',      C.code,   tTop + 8);
  doc.text('HSN/SAC',   C.hsn,    tTop + 8);
  doc.text('Qty',       C.qty,    tTop + 8);
  doc.text('Unit',      C.unit,   tTop + 8);
  doc.text('Price',     C.price,  tTop + 8);
  doc.text('Amount',    C.amount, tTop + 8);
  return tTop + TABLE_HDR_H;
}

function drawFooter(doc, order) {
  doc.rect(0, FOOTER_Y, PAGE_W, FOOTER_H).fill(NAVY);
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
    .text('Thank you for your business!', 40, FOOTER_Y + 12);
  doc.fillColor(GOLD).fontSize(8).font('Helvetica-Oblique')
    .text('"Come Experience the Quality" — Adiyogi International', 40, FOOTER_Y + 28);
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
    .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, FOOTER_Y + 44);
  doc.fillColor('white').fontSize(9).font('Helvetica')
    .text(`Order ID: ${order.orderId}`, 0, FOOTER_Y + 44, { align: 'right', width: 555 });
}

function drawSummary(doc, order) {
  // rowY is already set by the caller to the y right after the total row
  // We use rowY implicitly through the passed-in sumTop
}

// ── Main export ───────────────────────────────────────────────────
async function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      // margin: 0  — we position everything manually, so PDFKit's auto-pagination
      // must not kick in. With margin:0 the internal content boundary is PAGE_H (842),
      // meaning our footer text at y≈816 stays on the same page.
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const chunks = [];
      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── First page header + address block ──
      drawFirstPageHeader(doc, order);
      let tableStartY = TABLE_TOP_P1;
      let rowY = drawTableHeader(doc, tableStartY);

      let totalQty = 0;

      // ── Item rows (with page-break logic) ──
      for (let idx = 0; idx < order.items.length; idx++) {
        const item = order.items[idx];

        // Would this row push past the break threshold?
        if (rowY + ROW_H > ROW_BREAK_Y) {
          // Close the table on this page
          doc.rect(MX, tableStartY, W, rowY - tableStartY).stroke('#D1D5DB');
          // Footer on this page
          drawFooter(doc, order);
          // New page
          doc.addPage();
          // Continuation header + new table header
          drawContinuationHeader(doc, order);
          tableStartY = TABLE_TOP_CONT;
          rowY = drawTableHeader(doc, tableStartY);
        }

        // Alternating row background
        doc.rect(MX, rowY, W, ROW_H).fill(idx % 2 === 0 ? 'white' : '#F8FAFF');

        doc.fillColor(DARK).fontSize(8).font('Helvetica');
        doc.text(String(idx + 1),         C.num,    rowY + 9);
        doc.text(item.name,               C.name,   rowY + 9, { width: 150, lineBreak: false });
        doc.text(item.itemCode || '',     C.code,   rowY + 9, { width: 65,  lineBreak: false });
        doc.text(item.hsnCode  || '',     C.hsn,    rowY + 9, { width: 60,  lineBreak: false });
        doc.text(String(item.quantity),   C.qty,    rowY + 9);
        doc.text(item.unit || 'Nos',      C.unit,   rowY + 9);
        doc.text(`Rs ${item.price}`,      C.price,  rowY + 9, { width: 45, align: 'right' });
        doc.text(`Rs ${item.amount}`,     C.amount, rowY + 9, { width: 50, align: 'right' });

        totalQty += item.quantity;
        rowY += ROW_H;
      }

      // ── Total row ──
      doc.rect(MX, rowY, W, ROW_H).fill(LIGHT);
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('TOTAL',                        C.name,   rowY + 8)
        .text(String(totalQty),               C.qty,    rowY + 8)
        .text(`Rs ${order.total.toFixed(2)}`, C.amount, rowY + 8, { width: 50, align: 'right' });
      rowY += ROW_H;

      // Table outer border (current page only)
      doc.rect(MX, tableStartY, W, rowY - tableStartY).stroke('#D1D5DB');

      // Check if summary block + footer fits on current page; if not, page-break
      const needSummaryY = rowY + SUMMARY_GAP + SUMMARY_H;
      if (needSummaryY > FOOTER_Y) {
        drawFooter(doc, order);
        doc.addPage();
        drawContinuationHeader(doc, order);
        rowY = CONT_HDR_H + TABLE_HDR_H + 10;
      }

      // ── Summary block ──
      const sumTop = rowY + SUMMARY_GAP;

      // Left box — amount in words
      doc.rect(MX, sumTop, 290, SUMMARY_H).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold')
        .text('Invoice Amount in Words:', 52, sumTop + 12);
      const amtWords = numberToWords(Math.round(order.total)) + ' Rupees Only';
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
        .text(amtWords, 52, sumTop + 28, { width: 266, lineGap: 2 });
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
        .text(`Payment Mode: ${order.paymentMode}`, 52, sumTop + 58);

      // Right box — totals
      doc.rect(345, sumTop, 210, SUMMARY_H).fill(LIGHT).stroke('#D1D5DB');
      doc.fillColor(GRAY).fontSize(9).font('Helvetica')
        .text('Sub Total', 357, sumTop + 12);
      doc.fillColor(DARK).fontSize(9).font('Helvetica')
        .text(`Rs ${order.subtotal.toFixed(2)}`, 345, sumTop + 12, { width: 198, align: 'right' });
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text('(GST Included)', 357, sumTop + 30);
      doc.rect(345, sumTop + 56, 210, 24).fill(NAVY);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text('TOTAL',                          357, sumTop + 63)
        .text(`Rs ${order.total.toFixed(2)}`,   345, sumTop + 63, { width: 198, align: 'right' });

      // ── Footer on last page ──
      drawFooter(doc, order);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default generateInvoicePDF;
