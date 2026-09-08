"use client";

import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "./animated-theme-toggler";
import { cn } from "@/lib/utils";

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme as "light" | "dark" | undefined}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground relative z-50 flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
        className,
      )}
      variant="circle"
    />
  );
}
