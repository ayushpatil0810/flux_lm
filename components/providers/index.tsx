"use client";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Root Client Providers wrapper combining ThemeProvider, QueryProvider,
 * and the global ToastProvider notification channel.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { QueryProvider, ThemeProvider, ToastProvider };
