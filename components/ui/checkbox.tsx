"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadge01Icon as Check, MinusSignIcon as Minus } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "group peer size-4 shrink-0 rounded-sm border border-input bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <HugeiconsIcon
        icon={Check}
        className="size-3.5 group-data-[state=indeterminate]:hidden"
        strokeWidth={3}
        aria-hidden
      />
      <HugeiconsIcon
        icon={Minus}
        className="hidden size-3.5 group-data-[state=indeterminate]:block"
        strokeWidth={3}
        aria-hidden
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
