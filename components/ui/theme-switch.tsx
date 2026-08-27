"use client"

import { useTheme } from "next-themes"
import { AnimatedThemeToggler } from "./animated-theme-toggler"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("size-8 opacity-0", className)} />
  }

  // resolvedTheme is either "light" or "dark", properly reflecting the system preference if theme="system"
  const currentTheme = (resolvedTheme || "dark") as "light" | "dark"

  return (
    <AnimatedThemeToggler
      theme={currentTheme}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={cn(
        "relative z-50 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
      variant="circle"
    />
  )
}
