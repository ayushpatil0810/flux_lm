import { extractText, getDocumentProxy } from "unpdf";

export interface ParsedPdfResult {
  text: string;
  totalPages: number;
}

/**
 * Extracts text content and page metadata from a PDF file buffer locally using unpdf.
 *
 * @param data - PDF binary data (Buffer, Uint8Array, or ArrayBuffer).
 * @returns Extracted text content and total page count.
 */
export async function parsePdf(
  data: Buffer | Uint8Array | ArrayBuffer,
): Promise<ParsedPdfResult> {
  const buffer =
    data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
  const pdf = await getDocumentProxy(buffer);
  const { text, totalPages } = await extractText(pdf, { mergePages: true });

  const textContent = Array.isArray(text)
    ? text.join("\n\n")
    : (text as string) || "";

  return {
    text: textContent.trim(),
    totalPages,
  };
}
