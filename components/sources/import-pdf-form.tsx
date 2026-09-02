"use client";

import * as React from "react";

import { useImportPdfSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { submitInBackground, type ImportFormProps } from "./import-shared";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** PDF upload with client-side type/size checks and a drag-and-drop target. */
export function ImportPdfForm({ workspaceId, onDone }: ImportFormProps) {
  const { push } = useToast();
  const importPdf = useImportPdfSource(workspaceId);

  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function acceptFile(candidate: File) {
    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setFileError("Choose a PDF file.");
      return;
    }
    if (candidate.size > MAX_PDF_BYTES) {
      setFile(null);
      setFileError("PDFs must be smaller than 20 MB.");
      return;
    }
    setFileError(null);
    setFile(candidate);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setFileError("Choose a PDF file first.");
      return;
    }
    push({
      title: "PDF added",
      description:
        "Flux is reading the file now. It will show as Ready when indexing finishes.",
    });
    submitInBackground(
      importPdf,
      { file, title: title.trim() || undefined },
      push,
      "Could not add PDF",
      onDone,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label id="pdf-file-label">PDF file</Label>
        <div
          role="group"
          aria-labelledby="pdf-file-label"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) acceptFile(dropped);
          }}
          className={`overflow-hidden rounded-md border border-dashed px-4 text-center transition-all ${file ? "py-4" : "py-7"}`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-1.5">
              <p className="max-w-full truncate text-sm font-medium">
                {file.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setFile(null);
                  inputRef.current?.focus();
                }}
              >
                Choose a different file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-muted-foreground text-sm">
                Drag a PDF here, up to 20 MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1.5"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-label="PDF file"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) acceptFile(picked);
              event.target.value = "";
            }}
          />
        </div>
        {fileError ? (
          <p role="alert" className="text-destructive text-sm">
            {fileError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="pdf-title">
          Title{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="pdf-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Defaults to the file name"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!file}>
          Upload PDF
        </Button>
      </DialogFooter>
    </form>
  );
}
