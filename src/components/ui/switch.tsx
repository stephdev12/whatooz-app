'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  size?: 'sm' | 'md'
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ariaLabel = 'Basculer',
  size = 'md',
}: SwitchProps) {
  const isSm = size === 'sm'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        isSm ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
        disabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200',
          isSm ? 'size-3.5' : 'size-4',
          isSm
            ? checked ? 'translate-x-4.5' : 'translate-x-0.5'
            : checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

export default Switch
