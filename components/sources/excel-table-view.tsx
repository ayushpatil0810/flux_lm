"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileSpreadsheetIcon,
  Search01Icon,
  Cancel01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { Source } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExcelSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  rows: string[][];
}

interface ExcelTableViewProps {
  source: Source;
}

/**
 * Generates spreadsheet column letters (A, B, C... Z, AA, AB...)
 */
function getColumnLetter(colIndex: number): string {
  let letter = "";
  let temp = colIndex + 1;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Parses raw text into Excel sheets if structured metadata is not available.
 */
function parseRawContentToSheets(content: string): ExcelSheet[] {
  if (!content || !content.trim()) return [];

  const rawBlocks = content.split(/(?=^##\s+)/m).filter(Boolean);

  if (rawBlocks.length === 0) {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const rows = lines.map((l) =>
      l.includes("\t")
        ? l.split("\t").map((c) => c.trim())
        : l.includes("|")
          ? l
              .split("|")
              .filter(Boolean)
              .map((c) => c.trim())
          : l.split(",").map((c) => c.trim()),
    );
    const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
    const normalized = rows.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push("");
      return copy;
    });

    return [
      {
        name: "Sheet 1",
        rowCount: normalized.length,
        columnCount: maxCols,
        rows: normalized,
      },
    ];
  }

  return rawBlocks.map((block, idx) => {
    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    let name = `Sheet ${idx + 1}`;
    let dataLines = lines;

    if (lines[0]?.startsWith("## ")) {
      name = lines[0].replace(/^##\s+/, "").trim() || name;
      dataLines = lines.slice(1);
    }

    const rows = dataLines.map((l) =>
      l.includes("\t")
        ? l.split("\t").map((c) => c.trim())
        : l.includes("|")
          ? l
              .split("|")
              .filter(Boolean)
              .map((c) => c.trim())
          : l.split(",").map((c) => c.trim()),
    );

    const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
    const normalized = rows.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push("");
      return copy;
    });

    return {
      name,
      rowCount: normalized.length,
      columnCount: maxCols,
      rows: normalized,
    };
  });
}

export function ExcelTableView({ source }: ExcelTableViewProps) {
  const [activeSheetIdx, setActiveSheetIdx] = React.useState(0);
  const [filterQuery, setFilterQuery] = React.useState("");
  const [hasCopied, setHasCopied] = React.useState(false);

  // Extract sheets from metadata or fallback to parsing raw content
  const sheets: ExcelSheet[] = React.useMemo(() => {
    const metaSheets = source.metadata?.sheets;
    if (Array.isArray(metaSheets) && metaSheets.length > 0) {
      return metaSheets as ExcelSheet[];
    }
    return parseRawContentToSheets(source.content || "");
  }, [source.metadata?.sheets, source.content]);

  // Reset active sheet if out of bounds
  React.useEffect(() => {
    if (activeSheetIdx >= sheets.length) {
      setActiveSheetIdx(0);
    }
  }, [sheets.length, activeSheetIdx]);

  const activeSheet = sheets[activeSheetIdx] ?? null;

  // Filter rows if user entered a query
  const displayRows = React.useMemo(() => {
    if (!activeSheet || !activeSheet.rows) return [];
    if (!filterQuery.trim()) return activeSheet.rows;

    const q = filterQuery.toLowerCase();
    return activeSheet.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
  }, [activeSheet, filterQuery]);

  const maxColumns = React.useMemo(() => {
    if (!activeSheet || !activeSheet.rows) return 0;
    return activeSheet.columnCount || (activeSheet.rows[0]?.length ?? 0);
  }, [activeSheet]);

  const copySheetData = React.useCallback(() => {
    if (!activeSheet) return;
    const tsv = activeSheet.rows.map((r) => r.join("\t")).join("\n");
    navigator.clipboard.writeText(tsv);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }, [activeSheet]);

  if (!sheets || sheets.length === 0 || !activeSheet) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 mb-3">
          <HugeiconsIcon
            icon={FileSpreadsheetIcon}
            strokeWidth={1.5}
            className="size-6 text-green-600"
          />
        </div>
        <p className="text-sm font-medium text-foreground">No sheet data found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          The workbook appears to be empty or could not be formatted into a table.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-3.5 py-2.5 shrink-0">
        {/* Sheet Tabs */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {sheets.map((sheet, index) => {
              const isActive = index === activeSheetIdx;
              return (
                <button
                  key={`${sheet.name}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveSheetIdx(index);
                    setFilterQuery("");
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors border",
                    isActive
                      ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <HugeiconsIcon
                    icon={FileSpreadsheetIcon}
                    strokeWidth={1.5}
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive ? "text-green-600" : "text-muted-foreground/70",
                    )}
                  />
                  <span>{sheet.name}</span>
                  <span
                    className={cn(
                      "ml-1 rounded px-1 text-[10px] font-mono",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {sheet.rowCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Controls: Search & Meta Stats */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 max-w-xs">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`Search ${activeSheet.name}...`}
              className="w-full rounded-md border border-border/70 bg-background pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline-block">
              {displayRows.length} rows · {maxColumns} cols
            </span>
            <button
              type="button"
              onClick={copySheetData}
              title="Copy sheet data (TSV)"
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background hover:bg-muted/70 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon
                icon={hasCopied ? Tick02Icon : Copy01Icon}
                strokeWidth={1.5}
                className={cn("size-3.5", hasCopied && "text-green-600")}
              />
              <span className="hidden sm:inline">{hasCopied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 overflow-auto border-t border-border/40">
        <table className="w-full border-collapse text-left font-sans text-xs">
          {/* Header row with column letters */}
          <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-xs shadow-2xs">
            <tr className="border-b border-border/70">
              {/* Row number top-left corner */}
              <th className="sticky left-0 z-30 w-12 min-w-12 bg-muted/95 px-2 py-1.5 text-center font-mono text-[10px] font-semibold text-muted-foreground/70 border-r border-border/60 select-none">
                #
              </th>
              {Array.from({ length: maxColumns }).map((_, colIdx) => (
                <th
                  key={`col-${colIdx}`}
                  className="min-w-28 max-w-64 border-r border-border/60 px-3 py-1.5 font-mono text-[11px] font-semibold text-muted-foreground select-none truncate"
                >
                  {getColumnLetter(colIdx)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/40 bg-card">
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={maxColumns + 1}
                  className="p-8 text-center text-xs text-muted-foreground"
                >
                  {filterQuery
                    ? `No rows matching "${filterQuery}"`
                    : "This sheet has no rows."}
                </td>
              </tr>
            ) : (
              displayRows.map((row, rowIdx) => {
                const isHeaderRow =
                  rowIdx === 0 &&
                  !filterQuery &&
                  row.some((cell) => isNaN(Number(cell)) && cell.length > 0);

                return (
                  <tr
                    key={`row-${rowIdx}`}
                    className={cn(
                      "transition-colors hover:bg-muted/40 group",
                      isHeaderRow ? "bg-muted/30 font-semibold" : "bg-card",
                    )}
                  >
                    {/* Row Index Column */}
                    <td className="sticky left-0 z-10 w-12 min-w-12 bg-muted/70 px-2 py-1.5 text-center font-mono text-[10px] text-muted-foreground/70 border-r border-border/60 select-none group-hover:bg-muted">
                      {rowIdx + 1}
                    </td>

                    {/* Cells */}
                    {Array.from({ length: maxColumns }).map((_, cellIdx) => {
                      const cellValue = row[cellIdx] ?? "";
                      const isNumeric =
                        cellValue.trim().length > 0 && !isNaN(Number(cellValue));

                      return (
                        <td
                          key={`cell-${rowIdx}-${cellIdx}`}
                          title={cellValue}
                          className={cn(
                            "min-w-28 max-w-64 border-r border-border/40 px-3 py-1.5 text-foreground/90 truncate",
                            isNumeric && "font-mono text-right",
                          )}
                        >
                          {cellValue || (
                            <span className="text-muted-foreground/30 select-none">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
