import * as React from 'react'
import { cn } from '@/lib/utils'

export function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative flex items-center', className)}
      {...props}
    />
  )
}

export function InputGroupAddon({
  align = 'inline-start',
  className,
  ...props
}: React.ComponentProps<'div'> & { align?: 'inline-start' | 'inline-end' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 pointer-events-none',
        align === 'inline-end' && 'ml-auto',
        className
      )}
      {...props}
    />
  )
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex w-full bg-transparent text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
