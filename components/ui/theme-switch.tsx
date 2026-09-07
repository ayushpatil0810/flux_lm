"use client";

import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "./animated-theme-toggler";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon as Moon } from "@hugeicons/core-free-icons";

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex size-8 items-center justify-center rounded-lg",
          className,
        )}
        aria-hidden="true"
      >
        <HugeiconsIcon icon={Moon} className="size-4.5" />
      </div>
    );
  }

  // resolvedTheme is either "light" or "dark", properly reflecting the system preference if theme="system"
  const currentTheme = (resolvedTheme || "dark") as "light" | "dark";

  return (
    <AnimatedThemeToggler
      theme={currentTheme}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground relative z-50 flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
        className,
      )}
      variant="circle"
    />
  );
}
