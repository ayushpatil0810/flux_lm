"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
}

/** Shared destructive-action confirm dialog. */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        <DialogHeader className="px-5 pt-5 pb-0 text-left">
          <DialogTitle className="text-heading font-serif line-clamp-2 pr-6 leading-snug">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {typeof description === "string" ? description : title}
          </DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 items-center justify-end gap-2 px-5 pb-5 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 text-xs"
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
