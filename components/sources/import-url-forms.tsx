"use client";

import * as React from "react";

import {
  useImportWebsiteSource,
  useImportYoutubeSource,
} from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { submitInBackground, type ImportFormProps } from "./import-shared";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlFormConfig {
  urlLabel: string;
  urlPlaceholder: string;
  urlHint: string;
  submitLabel: string;
  pendingLabel: string;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
}

function useUrlForm(
  workspaceId: string,
  onDone: () => void,
  mutation: ReturnType<
    typeof useImportWebsiteSource | typeof useImportYoutubeSource
  >,
  config: UrlFormConfig,
) {
  const { push } = useToast();
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const fieldErrors: Record<string, string> = {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    push({
      title: config.successTitle,
      description: config.successDescription,
    });
    submitInBackground(
      mutation,
      { url: url.trim(), title: title.trim() || undefined },
      push,
      config.errorTitle,
      onDone,
    );
  }

  return { url, setUrl, title, setTitle, fieldErrors, handleSubmit };
}

function UrlFormFields({
  idPrefix,
  config,
  form,
}: {
  idPrefix: string;
  config: UrlFormConfig;
  form: ReturnType<typeof useUrlForm>;
}) {
  const { url, setUrl, title, setTitle, fieldErrors, handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-url`}>{config.urlLabel}</Label>
        <Input
          id={`${idPrefix}-url`}
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={config.urlPlaceholder}
          aria-invalid={Boolean(fieldErrors.url)}
          aria-describedby={
            fieldErrors.url ? `${idPrefix}-url-error` : `${idPrefix}-url-hint`
          }
        />
        {fieldErrors.url ? (
          <p id={`${idPrefix}-url-error`} className="text-destructive text-sm">
            {fieldErrors.url}
          </p>
        ) : (
          <p
            id={`${idPrefix}-url-hint`}
            className="text-muted-foreground text-xs"
          >
            {config.urlHint}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>
          Title{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}-title`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Leave blank to detect it"
          aria-invalid={Boolean(fieldErrors.title)}
        />
        {fieldErrors.title ? (
          <p className="text-destructive text-sm">{fieldErrors.title}</p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={url.trim().length === 0}>
          {config.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ImportWebsiteForm({ workspaceId, onDone }: ImportFormProps) {
  const mutation = useImportWebsiteSource(workspaceId);
  const config: UrlFormConfig = {
    urlLabel: "Page URL",
    urlPlaceholder: "https://example.com/article",
    urlHint: "Flux reads the page and indexes its text.",
    submitLabel: "Add website",
    pendingLabel: "Adding…",
    successTitle: "Website added",
    successDescription: "Flux is reading the page now.",
    errorTitle: "Could not add website",
  };
  const form = useUrlForm(workspaceId, onDone, mutation, config);
  return <UrlFormFields idPrefix="website" config={config} form={form} />;
}

export function ImportYoutubeForm({ workspaceId, onDone }: ImportFormProps) {
  const mutation = useImportYoutubeSource(workspaceId);
  const config: UrlFormConfig = {
    urlLabel: "Video URL or ID",
    urlPlaceholder: "https://www.youtube.com/watch?v=…",
    urlHint: "Flux imports the transcript, so the video needs captions.",
    submitLabel: "Add video",
    pendingLabel: "Adding…",
    successTitle: "Video added",
    successDescription: "Flux is importing the transcript now.",
    errorTitle: "Could not add video",
  };
  const form = useUrlForm(workspaceId, onDone, mutation, config);
  return <UrlFormFields idPrefix="youtube" config={config} form={form} />;
}
