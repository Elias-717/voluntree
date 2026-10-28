import { describe, expect, it } from "vitest";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  StandardFonts,
  decodePDFRawStream,
  type PDFFont,
} from "pdf-lib";
import {
  CERTIFICATE_TITLE,
  PROTOTYPE_WATERMARK,
  cleanText,
  fitText,
  formatDate,
  generateCertificatePdf,
  type CertificateInput,
} from "./certificate";

const sample: CertificateInput = {
  studentName: "Aisha Rahman",
  missionTitle: "Orientation Week Welcome Desk",
  date: "2026-11-02",
  certificateId: "VT-2026-000123",
};

interface DrawnText {
  text: string;
  /** Left edge and baseline of the text, in PDF points. */
  x: number;
  y: number;
  size: number;
  /** Standard font name, e.g. "Helvetica". */
  font: string;
}

/**
 * Returns every piece of text drawn on the first page, in drawing order.
 * pdf-lib stores page content compressed. Each drawText call is written as
 * "BT … /Font size Tf … a b c d x y Tm <hex> Tj … ET". This unpacks the content
 * and reads those operators, decoding the hex with the font's own character table.
 * It reads PDFs made by pdf-lib with standard fonts, not arbitrary PDFs.
 */
async function extractDrawnText(bytes: Uint8Array): Promise<DrawnText[]> {
  const doc = await PDFDocument.load(bytes);
  const contents = doc.getPage(0).node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => doc.context.lookup(ref))
      : [contents];

  const decodeTable = await winAnsiDecodeTable();
  const drawn: DrawnText[] = [];
  for (const stream of streams) {
    if (!(stream instanceof PDFRawStream)) throw new Error("Unexpected content stream type");
    const operators = Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
    for (const [block] of operators.matchAll(/BT[\s\S]*?ET/g)) {
      const font = /\/(\S+?)-\d+ ([\d.]+) Tf/.exec(block);
      const matrix = /(?:[-\d.e]+ ){4}([-\d.e]+) ([-\d.e]+) Tm/.exec(block);
      const hex = /<([0-9A-Fa-f]*)>\s*Tj/.exec(block);
      if (!font || !matrix || !hex) throw new Error(`Unexpected text block: ${block}`);
      const codes = hex[1].match(/../g) ?? [];
      drawn.push({
        text: codes.map((code) => decodeTable.get(parseInt(code, 16)) ?? "\uFFFD").join(""),
        x: Number(matrix[1]),
        y: Number(matrix[2]),
        size: Number(font[2]),
        font: font[1],
      });
    }
  }
  return drawn;
}

async function extractText(bytes: Uint8Array): Promise<string[]> {
  return (await extractDrawnText(bytes)).map((drawn) => drawn.text);
}

/** Maps each standard-font byte code back to its character, using pdf-lib's own encoder. */
async function winAnsiDecodeTable(): Promise<Map<number, string>> {
  const font = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica);
  const table = new Map<number, string>();
  for (const codePoint of font.getCharacterSet()) {
    const char = String.fromCodePoint(codePoint);
    table.set(parseInt(font.encodeText(char).asString(), 16), char);
  }
  return table;
}

async function timesFont(): Promise<PDFFont> {
  return (await PDFDocument.create()).embedFont(StandardFonts.TimesRomanBoldItalic);
}

async function helveticaFont(): Promise<PDFFont> {
  return (await PDFDocument.create()).embedFont(StandardFonts.Helvetica);
}

describe("generateCertificatePdf", () => {
  it("returns a valid one-page A4 landscape PDF", async () => {
    const bytes = await generateCertificatePdf(sample);
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize()).toEqual({ width: 842, height: 595 });
  });

  it("shows the title, all four fields and the exact watermark", async () => {
    const text = await extractText(await generateCertificatePdf(sample));
    expect(text).toContain(CERTIFICATE_TITLE);
    expect(text).toContain("Aisha Rahman");
    expect(text).toContain("Orientation Week Welcome Desk");
    expect(text).toContain("2 November 2026");
    expect(text).toContain("VT-2026-000123");
    expect(text).toContain("Prototype — not an official AIU document");
    expect(PROTOTYPE_WATERMARK).toContain("—"); // a real em dash, not a hyphen
  });

  it("contains no hours, images or signature", async () => {
    const bytes = await generateCertificatePdf(sample);
    const allText = (await extractText(bytes)).join(" ").toLowerCase();
    expect(allText).not.toContain("hour");
    expect(allText).not.toContain("signature");
    // No logo or signature image: pdf-lib adds an empty image list to every page, and it stays empty.
    const resources = (await PDFDocument.load(bytes)).getPage(0).node.Resources();
    const images = resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
    expect(images?.keys() ?? []).toHaveLength(0);
  });

  it("fits a long name and mission title on two lines without losing words", async () => {
    const longInput = {
      ...sample,
      studentName: "Maximiliana Alexandra Constantina Wilhelmina Fitzgerald-Montgomery",
      missionTitle:
        "International Cultural Festival Logistics, Registration Desk and Visitor Guidance Team for the Main Hall",
    };
    const text = await extractText(await generateCertificatePdf(longInput));
    const nameLines = text.slice(text.indexOf("This certificate is presented to") + 1, text.indexOf("for volunteering in the mission"));
    const missionLines = text.slice(text.indexOf("for volunteering in the mission") + 1, text.indexOf("DATE"));
    expect(nameLines.length).toBe(2);
    expect(nameLines.join(" ")).toBe(longInput.studentName);
    expect(missionLines.length).toBe(2);
    expect(missionLines.join(" ")).toBe(longInput.missionTitle);
  });

  it("shrinks a long certificate ID to fit its footer column", async () => {
    const longId = "VT-2026-ORIENTATION-WEEK-WELCOME-DESK-000123-REISSUE-A";
    const drawn = await extractDrawnText(await generateCertificatePdf({ ...sample, certificateId: longId }));
    const id = drawn.find((d) => d.text === longId)!;
    const date = drawn.find((d) => d.text === "2 November 2026")!;
    expect(id).toBeDefined();
    expect(id.font).toBe("Helvetica");
    expect(id.size).toBeLessThan(13);

    const font = await helveticaFont();
    const idRight = id.x + font.widthOfTextAtSize(id.text, id.size);
    const dateRight = date.x + font.widthOfTextAtSize(date.text, date.size);
    // The ID column is 280pt wide, centred at 571: from 431 to 711.
    expect(id.x).toBeGreaterThanOrEqual(431);
    expect(idRight).toBeLessThanOrEqual(711);
    expect(id.x).toBeGreaterThan(dateRight); // no overlap with the date
    expect(idRight).toBeLessThan(842 - 34); // inside the inner border
  });

  it("keeps a normal certificate ID at full size", async () => {
    const drawn = await extractDrawnText(await generateCertificatePdf(sample));
    expect(drawn.find((d) => d.text === "VT-2026-000123")?.size).toBe(13);
  });

  it("rejects a certificate ID too long even at the smallest size", async () => {
    await expect(generateCertificatePdf({ ...sample, certificateId: "X".repeat(80) })).rejects.toThrow(
      /too long to fit/,
    );
  });

  it("collapses repeated spaces and trims the ends of every field", async () => {
    const text = await extractText(
      await generateCertificatePdf({
        studentName: "  Aisha    Rahman ",
        missionTitle: "Orientation\u00A0\u00A0Week   Welcome Desk",
        date: "2026-11-02",
        certificateId: " VT-2026-000123  ",
      }),
    );
    expect(text).toContain("Aisha Rahman");
    expect(text).toContain("Orientation Week Welcome Desk");
    expect(text).toContain("VT-2026-000123");
  });

  it.each([
    ["a line break", "Aisha\nRahman"],
    ["a carriage return", "Aisha\r\nRahman"],
    ["a tab", "Aisha\tRahman"],
    ["a null character", "Aisha\u0000Rahman"],
    ["an escape character", "Aisha\u001BRahman"],
    ["a delete character", "Aisha\u007FRahman"],
    ["a C1 control character", "Aisha\u0085Rahman"],
  ])("rejects %s in a field", async (_case, studentName) => {
    await expect(generateCertificatePdf({ ...sample, studentName })).rejects.toThrow(/control character/);
  });

  it("rejects control characters in the mission title and certificate ID too", async () => {
    await expect(generateCertificatePdf({ ...sample, missionTitle: "Welcome\nDesk" })).rejects.toThrow(
      /Mission title contains a control character/,
    );
    await expect(generateCertificatePdf({ ...sample, certificateId: "VT-\t1" })).rejects.toThrow(
      /Certificate ID contains a control character/,
    );
  });

  it("rejects text too long to fit", async () => {
    await expect(
      generateCertificatePdf({ ...sample, missionTitle: "Very long mission title ".repeat(20) }),
    ).rejects.toThrow(/too long to fit/);
  });

  it.each([
    ["studentName", ""],
    ["missionTitle", "   "],
    ["certificateId", ""],
  ])("rejects an empty %s", async (field, value) => {
    await expect(generateCertificatePdf({ ...sample, [field]: value })).rejects.toThrow(RangeError);
  });

  it("rejects characters the standard fonts cannot display", async () => {
    await expect(generateCertificatePdf({ ...sample, studentName: "عائشة" })).rejects.toThrow(
      /cannot display/,
    );
  });

  it("accepts Western European accents", async () => {
    const text = await extractText(await generateCertificatePdf({ ...sample, studentName: "José Müller" }));
    expect(text).toContain("José Müller");
  });
});

describe("formatDate", () => {
  it.each([
    ["2026-11-02", "2 November 2026"],
    ["2026-01-31", "31 January 2026"],
    ["2028-02-29", "29 February 2028"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatDate(input)).toBe(expected);
  });

  it.each(["2026-02-30", "2025-02-29", "2026-13-01", "2026-00-10", "2026-04-31", "02/11/2026", "2026-11-2", ""])(
    "rejects %j",
    (input) => {
      expect(() => formatDate(input)).toThrow(RangeError);
    },
  );
});

describe("fitText", () => {
  const box = { maxWidth: 300, height: 60, maxSize: 30, minSize: 12, maxLines: 2 };

  it("keeps short text on one line at the largest size", async () => {
    expect(fitText("Aisha", await timesFont(), box)).toEqual({ size: 30, lines: ["Aisha"] });
  });

  it("shrinks and wraps long text so every line fits the box", async () => {
    const font = await timesFont();
    const { size, lines } = fitText("Maximiliana Alexandra Constantina Fitzgerald", font, box);
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(size).toBeLessThan(30);
    for (const line of lines) expect(font.widthOfTextAtSize(line, size)).toBeLessThanOrEqual(300);
    expect(lines.length * size * 1.2).toBeLessThanOrEqual(60);
  });
});

describe("cleanText", () => {
  it("collapses runs of ordinary and no-break spaces and trims", () => {
    expect(cleanText("  Aisha \u00A0  Rahman  ", "Student name")).toBe("Aisha Rahman");
  });

  it("names the field and the character code in the error", () => {
    expect(() => cleanText("Aisha\tRahman", "Student name")).toThrow(
      "Student name contains a control character (U+0009).",
    );
  });
});
