import mammoth from "mammoth";
import JSZip from "jszip";
import { parsePdf } from "@/lib/pdf";

type SupportedFileExtension =
  | "pdf"
  | "txt"
  | "md"
  | "docx"
  | "pptx"
  | "xlsx";

export interface ExcelSheetData {
  name: string;
  rowCount: number;
  columnCount: number;
  rows: string[][];
}

export interface PptSlideData {
  slideNumber: number;
  title: string;
  bullets: string[];
}

export interface ParsedFileResult {
  text: string;
  /** Number of pages/sheets extracted, if known. */
  sectionCount?: number;
  /** Structured sheets for Excel files */
  sheets?: ExcelSheetData[];
  /** Structured slide data for PPTX files */
  slides?: PptSlideData[];
  /** HTML representation for DOCX files */
  html?: string;
}

/**
 * Returns the lowercase file extension from a filename, without the dot.
 */
export function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
}

/**
 * Maps a file extension to the source type stored in the database.
 */
export function extensionToSourceType(
  ext: string,
): "PDF" | "MARKDOWN" | "TEXT" {
  if (ext === "pdf") return "PDF";
  if (ext === "md") return "MARKDOWN";
  return "TEXT";
}

/**
 * MIME types accepted for file uploads (used by the API controller validation).
 */
const ACCEPTED_FILE_TYPES: Record<SupportedFileExtension, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const SUPPORTED_EXTENSIONS = Object.keys(
  ACCEPTED_FILE_TYPES,
) as SupportedFileExtension[];

/**
 * Parses a plain text or markdown file buffer into a string.
 */
async function parsePlainText(buffer: Buffer): Promise<ParsedFileResult> {
  return { text: buffer.toString("utf-8") };
}

/**
 * Extracts raw text and HTML from a DOCX buffer using mammoth.
 */
async function parseDocx(buffer: Buffer): Promise<ParsedFileResult> {
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  return {
    text: textResult.value.trim(),
    html: htmlResult.value,
  };
}

/**
 * Extracts slide text and structured slide objects from a PPTX buffer.
 * PPTX files are ZIP archives; each slide is at ppt/slides/slide*.xml.
 */
async function parsePptx(buffer: Buffer): Promise<ParsedFileResult> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter(
      (name) =>
        name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
    )
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      return numA - numB;
    });

  const slides: PptSlideData[] = [];
  const slideTexts: string[] = [];

  for (let idx = 0; idx < slideFiles.length; idx++) {
    const slideName = slideFiles[idx];
    const file = zip.files[slideName];
    if (!file) continue;
    const xmlContent = await file.async("string");

    // Extract shapes (<p:sp>...</p:sp>)
    const shapeMatches = xmlContent.match(/<p:sp[\s\S]*?<\/p:sp>/g) ?? [];
    let slideTitle = "";
    const slideBullets: string[] = [];

    for (const shapeXml of shapeMatches) {
      const isTitleShape =
        /type="(title|ctrTitle)"/.test(shapeXml) ||
        /<p:cNvPr[^>]*name="[^"]*Title[^"]*"/i.test(shapeXml);

      // Extract paragraphs inside this shape: <a:p>...</a:p>
      const paragraphMatches = shapeXml.match(/<a:p[\s\S]*?<\/a:p>/g) ?? [];
      for (const pXml of paragraphMatches) {
        const textMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) ?? [];
        const paraText = textMatches
          .map((m) => m.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean)
          .join(" ");

        if (!paraText) continue;

        if (isTitleShape && !slideTitle) {
          slideTitle = paraText;
        } else if (!slideTitle && slideBullets.length === 0) {
          slideTitle = paraText;
        } else {
          slideBullets.push(paraText);
        }
      }
    }

    // Fallback if no shapes matched: grab all <a:t>
    if (!slideTitle && slideBullets.length === 0) {
      const allTextMatches = xmlContent.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) ?? [];
      const allTexts = allTextMatches
        .map((m) => m.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean);
      if (allTexts.length > 0) {
        slideTitle = allTexts[0];
        slideBullets.push(...allTexts.slice(1));
      }
    }

    const slideNum = idx + 1;
    const finalTitle = slideTitle || `Slide ${slideNum}`;

    slides.push({
      slideNumber: slideNum,
      title: finalTitle,
      bullets: slideBullets,
    });

    const textLines = [
      `### Slide ${slideNum}: ${finalTitle}`,
      ...slideBullets.map((b) => `• ${b}`),
    ];
    slideTexts.push(textLines.join("\n"));
  }

  return {
    text: slideTexts.join("\n\n"),
    sectionCount: slideFiles.length,
    slides,
  };
}

/**
 * Extracts cell data and structured sheet objects from an XLSX buffer using ExcelJS.
 */
async function parseXlsx(buffer: Buffer): Promise<ParsedFileResult> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.default.Workbook();
  // ExcelJS expects an ArrayBuffer; convert Node Buffer accordingly
  await workbook.xlsx.load(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer,
  );

  const sheets: ExcelSheetData[] = [];
  const sheetTexts: string[] = [];

  workbook.eachSheet((worksheet) => {
    const rawRows: string[][] = [];
    let maxCols = 0;

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      if (rawRows.length >= 1000) return; // Cap rows for preview safety
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = "";
        if (cell.value !== null && cell.value !== undefined) {
          if (cell.value instanceof Date) {
            val = cell.value.toLocaleDateString();
          } else if (typeof cell.value === "object") {
            const objVal = cell.value as unknown as Record<string, unknown>;
            if (objVal.result !== null && objVal.result !== undefined) {
              val = String(objVal.result);
            } else if (typeof objVal.text === "string") {
              val = objVal.text;
            } else {
              val = cell.text ?? "";
            }
          } else {
            val = String(cell.value);
          }
        }
        cells[colNumber - 1] = val.trim();
      });

      for (let i = 0; i < cells.length; i++) {
        if (cells[i] === undefined) cells[i] = "";
      }
      if (cells.length > maxCols) maxCols = cells.length;
      rawRows.push(cells);
    });

    const normalizedRows = rawRows.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push("");
      return copy;
    });

    sheets.push({
      name: worksheet.name,
      rowCount: worksheet.rowCount || normalizedRows.length,
      columnCount: maxCols,
      rows: normalizedRows,
    });

    const textRows: string[] = [`## ${worksheet.name}`];
    normalizedRows.forEach((row) => {
      if (row.some((c) => c.length > 0)) {
        textRows.push(row.join("\t"));
      }
    });
    if (textRows.length > 1) {
      sheetTexts.push(textRows.join("\n"));
    }
  });

  return {
    text: sheetTexts.join("\n\n"),
    sectionCount: sheets.length,
    sheets,
  };
}

/**
 * Parses a file buffer based on its extension and returns extracted text and preview structures.
 *
 * @param buffer - Raw file data.
 * @param extension - Lowercase file extension without dot (e.g. "docx").
 * @returns Extracted text and optional structured preview data.
 * @throws {Error} If the extension is unsupported.
 */
export async function parseFile(
  buffer: Buffer,
  extension: string,
): Promise<ParsedFileResult> {
  switch (extension) {
    case "pdf": {
      const pdfResult = await parsePdf(buffer);
      return {
        text: pdfResult.text,
        sectionCount: pdfResult.totalPages,
      };
    }
    case "txt":
    case "md":
      return parsePlainText(buffer);
    case "docx":
      return parseDocx(buffer);
    case "pptx":
      return parsePptx(buffer);
    case "xlsx":
      return parseXlsx(buffer);
    default:
      throw new Error(`Unsupported file extension: .${extension}`);
  }
}
