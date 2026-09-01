"use client";

import * as React from "react";

import { MemoriesView } from "@/components/memories/memories-view";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MemoriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemoriesSheet({ open, onOpenChange }: MemoriesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/30 px-6 py-4">
          <SheetTitle>Memories</SheetTitle>
          <SheetDescription>
            Facts and preferences Flux remembers from your conversations.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <MemoriesView />
        </div>
      </SheetContent>
    </Sheet>
  );
}
