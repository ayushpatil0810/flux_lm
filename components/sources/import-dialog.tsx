"use client";

import * as React from "react";

import { ImportPdfForm } from "./import-pdf-form";
import { ImportTextForm } from "./import-text-form";
import { ImportWebsiteForm, ImportYoutubeForm } from "./import-url-forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ImportTab = "pdf" | "website" | "youtube" | "text";

interface ImportSourceDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful import, e.g. to clear active filters. */
  onImported?: () => void;
}

/** Four-way import dialog matching the backend's import endpoints. */
export function ImportSourceDialog({
  workspaceId,
  open,
  onOpenChange,
  onImported,
}: ImportSourceDialogProps) {
  const [tab, setTab] = React.useState<ImportTab>("pdf");

  const done = () => {
    onOpenChange(false);
    onImported?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-heading">
            Add a source
          </DialogTitle>
          <DialogDescription>
            Flux reads it, indexes it, and cites it in answers.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as ImportTab)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="website">Website</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>
          <TabsContent value="pdf" className="pt-3">
            <ImportPdfForm workspaceId={workspaceId} onDone={done} />
          </TabsContent>
          <TabsContent value="website" className="pt-3">
            <ImportWebsiteForm workspaceId={workspaceId} onDone={done} />
          </TabsContent>
          <TabsContent value="youtube" className="pt-3">
            <ImportYoutubeForm workspaceId={workspaceId} onDone={done} />
          </TabsContent>
          <TabsContent value="text" className="pt-3">
            <ImportTextForm workspaceId={workspaceId} onDone={done} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
