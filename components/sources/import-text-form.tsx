"use client";

import * as React from "react";

import { useImportTextSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { submitInBackground, type ImportFormProps } from "./import-shared";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Pasted or written text/markdown import. */
export function ImportTextForm({ workspaceId, onDone }: ImportFormProps) {
  const { push } = useToast();
  const importText = useImportTextSource(workspaceId);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [format, setFormat] = React.useState<"TEXT" | "MARKDOWN">("TEXT");
  const fieldErrors: Record<string, string> = {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    push({
      title: "Text added",
      description: "Processing has started.",
    });
    submitInBackground(
      importText,
      { title: title.trim(), content, type: format },
      push,
      "Could not add text",
      onDone,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="text-title">Title</Label>
        <Input
          id="text-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Meeting notes, chapter excerpt, …"
          aria-invalid={Boolean(fieldErrors.title)}
        />
        {fieldErrors.title ? (
          <p className="text-destructive text-sm">{fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="text-content">Content</Label>
        <Textarea
          id="text-content"
          required
          rows={7}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste or write the text to add"
          aria-invalid={Boolean(fieldErrors.content)}
        />
        {fieldErrors.content ? (
          <p className="text-destructive text-sm">{fieldErrors.content}</p>
        ) : null}
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="text-sm font-medium">Format</legend>
        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="text-format"
              value="TEXT"
              checked={format === "TEXT"}
              onChange={() => setFormat("TEXT")}
              className="accent-primary size-4"
            />
            Plain text
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="text-format"
              value="MARKDOWN"
              checked={format === "MARKDOWN"}
              onChange={() => setFormat("MARKDOWN")}
              className="accent-primary size-4"
            />
            Markdown
          </label>
        </div>
      </fieldset>

      <DialogFooter>
        <Button
          type="submit"
          disabled={title.trim().length === 0 || content.trim().length === 0}
        >
          Add text
        </Button>
      </DialogFooter>
    </form>
  );
}
