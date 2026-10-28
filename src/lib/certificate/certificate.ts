// Certificate of Appreciation PDF (FR-010, BR-12, DEC-008).
// Shows name, mission, date and certificate ID only: no hours, no AIU logo, no signature.
//
// Uses the standard PDF fonts (Times, Helvetica), so no font file is needed.
// They support Latin characters only (the WinAnsi set: English letters, digits,
// common punctuation and Western European accents such as é, ñ, ü).
// Text with other characters, such as Arabic or Chinese, is rejected with an error.
// Input text is tidied first: control characters (including tabs and line breaks)
// are rejected, and runs of spaces are collapsed to one space.

import { PDFDocument, PDFFont, StandardFonts, degrees, rgb } from "pdf-lib";

export interface CertificateInput {
  studentName: string;
  missionTitle: string;
  /** Calendar date as "YYYY-MM-DD", e.g. "2026-11-02". */
  date: string;
  certificateId: string;
}

export const CERTIFICATE_TITLE = "Certificate of Appreciation";
/** Required on every demo certificate (BR-12). */
export const PROTOTYPE_WATERMARK = "Prototype — not an official AIU document";

// Design (Option A: classic frame). A4 landscape, sizes in PDF points.
const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const GREEN = rgb(0.18, 0.49, 0.2); // #2E7D32
const GOLD = rgb(0.79, 0.64, 0.15); // #C9A227
const DARK = rgb(0.13, 0.13, 0.13);
const GREY = rgb(0.4, 0.4, 0.4);
const WATERMARK_GREY = rgb(0.5, 0.5, 0.5);
const WATERMARK_OPACITY = 0.25;
const WATERMARK_SIZE = 30;
const WATERMARK_ANGLE = 20; // degrees: shallow enough to stay clear of the title and footer
const LINE_HEIGHT = 1.2; // line spacing, as a multiple of the font size

/** Width available for the name and mission title, inside the inner border. */
const TEXT_BOX_WIDTH = 640;
/** Vertical space reserved for each block, so a long block never reaches its neighbours. */
const NAME_BOX = { centerY: 352, height: 76, maxSize: 34, minSize: 18, maxLines: 2 };
const MISSION_BOX = { centerY: 228, height: 60, maxSize: 24, minSize: 14, maxLines: 2 };
/** Footer columns: centred 150pt either side of the page centre, 20pt apart, inside the border. */
const FOOTER_COLUMN_OFFSET = 150;
const FOOTER_VALUE_BOX = { maxWidth: 280, height: 16, maxSize: 13, minSize: 8, maxLines: 1 };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function generateCertificatePdf(input: CertificateInput): Promise<Uint8Array> {
  const studentName = cleanText(input.studentName, "Student name");
  const missionTitle = cleanText(input.missionTitle, "Mission title");
  const certificateId = cleanText(input.certificateId, "Certificate ID");
  const displayDate = formatDate(input.date);

  const doc = await PDFDocument.create();
  doc.setTitle(`${CERTIFICATE_TITLE} – ${certificateId}`);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const titleFont = await doc.embedFont(StandardFonts.TimesRomanBold);
  const nameFont = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const missionFont = await doc.embedFont(StandardFonts.TimesRoman);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const labelFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // All standard fonts share one character set, so one check covers every field.
  for (const [label, text] of [
    ["Student name", studentName],
    ["Mission title", missionTitle],
    ["Certificate ID", certificateId],
  ]) {
    checkSupportedCharacters(text, label, bodyFont);
  }

  // Gold double border.
  page.drawRectangle({
    x: 24, y: 24, width: PAGE_WIDTH - 48, height: PAGE_HEIGHT - 48,
    borderColor: GOLD, borderWidth: 3,
  });
  page.drawRectangle({
    x: 34, y: 34, width: PAGE_WIDTH - 68, height: PAGE_HEIGHT - 68,
    borderColor: GOLD, borderWidth: 1,
  });

  // Title and a short gold rule under it.
  drawCentered(page, CERTIFICATE_TITLE, titleFont, 40, 470, GREEN);
  drawRule(page, 448, 140, 1.5);

  drawCentered(page, "This certificate is presented to", bodyFont, 14, 410, GREY);
  drawBlock(page, studentName, nameFont, NAME_BOX, DARK);

  drawCentered(page, "for volunteering in the mission", bodyFont, 14, 282, GREY);
  drawBlock(page, missionTitle, missionFont, MISSION_BOX, GREEN);

  // Footer: date on the left, certificate ID on the right.
  drawRule(page, 168, 520, 0.75);
  const leftX = PAGE_WIDTH / 2 - FOOTER_COLUMN_OFFSET;
  const rightX = PAGE_WIDTH / 2 + FOOTER_COLUMN_OFFSET;
  drawCenteredAt(page, "DATE", labelFont, 9, leftX, 138, GREY);
  drawCenteredAt(page, displayDate, bodyFont, 13, leftX, 120, DARK);
  drawCenteredAt(page, "CERTIFICATE ID", labelFont, 9, rightX, 138, GREY);
  // A long ID shrinks to fit its column, so it never reaches the date or the border.
  const id = fitText(certificateId, bodyFont, FOOTER_VALUE_BOX);
  drawCenteredAt(page, id.lines[0], bodyFont, id.size, rightX, 120, DARK);

  drawWatermark(page, labelFont);

  return doc.save();
}

/**
 * Finds the largest font size at which the text fits the box, wrapping on spaces.
 * Throws if the text does not fit even at the smallest size.
 */
export function fitText(
  text: string,
  font: PDFFont,
  box: { maxWidth: number; height: number; maxSize: number; minSize: number; maxLines: number },
): { size: number; lines: string[] } {
  for (let size = box.maxSize; size >= box.minSize; size--) {
    const lines = wrapWords(text, font, size, box.maxWidth);
    const fitsWidth = lines.every((line) => font.widthOfTextAtSize(line, size) <= box.maxWidth);
    const fitsHeight = lines.length * size * LINE_HEIGHT <= box.height;
    if (fitsWidth && fitsHeight && lines.length <= box.maxLines) {
      return { size, lines };
    }
  }
  throw new RangeError(`Text is too long to fit on the certificate: "${text}"`);
}

/** Splits text into lines no wider than maxWidth. A single word wider than maxWidth stays on its own line. */
function wrapWords(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (current !== "" && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  return lines;
}

/** Rejects control characters, collapses runs of spaces to one, and trims the ends. */
export function cleanText(value: string, label: string): string {
  if (typeof value !== "string") {
    throw new RangeError(`${label} must be text.`);
  }
  for (const char of value) {
    const code = char.codePointAt(0)!;
    // C0 and C1 control characters, e.g. null, tab, line break, escape.
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
      throw new RangeError(
        `${label} contains a control character (U+${code.toString(16).toUpperCase().padStart(4, "0")}). ` +
          "Tabs and line breaks are not allowed.",
      );
    }
  }
  // Ordinary and no-break spaces; other whitespace is a control character or unsupported.
  const cleaned = value.replace(/[ \u00A0]+/g, " ").trim();
  if (cleaned === "") {
    throw new RangeError(`${label} must not be empty.`);
  }
  return cleaned;
}

function checkSupportedCharacters(text: string, label: string, font: PDFFont): void {
  const supported = new Set(font.getCharacterSet());
  for (const char of text) {
    if (!supported.has(char.codePointAt(0)!)) {
      throw new RangeError(
        `${label} contains a character the certificate font cannot display: "${char}". ` +
          "Only Latin characters are supported in this prototype.",
      );
    }
  }
}

/** "2026-11-02" → "2 November 2026". Rejects impossible dates such as 2026-02-30. */
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    // Date.UTC rolls 2026-02-30 over to 2 March, so compare the parts back.
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return `${day} ${MONTHS[month - 1]} ${year}`;
    }
  }
  throw new RangeError(`Date must be a real calendar date in YYYY-MM-DD format. Received: ${date}`);
}

type Page = ReturnType<PDFDocument["addPage"]>;
type Color = ReturnType<typeof rgb>;

function drawCenteredAt(
  page: Page, text: string, font: PDFFont, size: number, centerX: number, y: number, color: Color,
): void {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

function drawCentered(page: Page, text: string, font: PDFFont, size: number, y: number, color: Color): void {
  drawCenteredAt(page, text, font, size, PAGE_WIDTH / 2, y, color);
}

function drawRule(page: Page, y: number, width: number, thickness: number): void {
  page.drawLine({
    start: { x: (PAGE_WIDTH - width) / 2, y },
    end: { x: (PAGE_WIDTH + width) / 2, y },
    thickness,
    color: GOLD,
  });
}

/** Draws wrapped, centred lines, vertically centred in the block's reserved space. */
function drawBlock(
  page: Page,
  text: string,
  font: PDFFont,
  box: { centerY: number; height: number; maxSize: number; minSize: number; maxLines: number },
  color: Color,
): void {
  const { size, lines } = fitText(text, font, { ...box, maxWidth: TEXT_BOX_WIDTH });
  const lineGap = size * LINE_HEIGHT;
  // Baseline of the first line, so the group of lines sits in the middle of the box.
  const firstBaseline = box.centerY + ((lines.length - 1) * lineGap) / 2 - size * 0.35;
  lines.forEach((line, i) => drawCentered(page, line, font, size, firstBaseline - i * lineGap, color));
}

/** Diagonal watermark across the middle of the page, drawn last so it sits on top. */
function drawWatermark(page: Page, font: PDFFont): void {
  const size = WATERMARK_SIZE;
  const angle = (WATERMARK_ANGLE * Math.PI) / 180;
  const width = font.widthOfTextAtSize(PROTOTYPE_WATERMARK, size);
  // Start point chosen so the middle of the rotated text lands on the page centre.
  const x = PAGE_WIDTH / 2 - (width / 2) * Math.cos(angle) + (size / 3) * Math.sin(angle);
  const y = PAGE_HEIGHT / 2 - (width / 2) * Math.sin(angle) - (size / 3) * Math.cos(angle);
  page.drawText(PROTOTYPE_WATERMARK, {
    x, y, size, font,
    color: WATERMARK_GREY,
    opacity: WATERMARK_OPACITY,
    rotate: degrees(WATERMARK_ANGLE),
  });
}
