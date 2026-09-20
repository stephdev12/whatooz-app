'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface WhatoozLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'light' | 'dark' | 'auto'
}

export function WhatoozLogo({
  className,
  size = 'md',
  showText = false,
}: WhatoozLogoProps) {
  // Dimensions for the icon container
  const sizeMap = {
    sm: { container: 'h-8 w-8', text: 'text-base' },
    md: { container: 'h-9 w-9', text: 'text-lg' },
    lg: { container: 'h-11 w-11', text: 'text-xl' },
    xl: { container: 'h-14 w-14', text: 'text-2xl' },
  }

  const currentSize = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Real Logo with Zoom Translate x2.5 */}
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 shrink-0',
          currentSize.container
        )}
      >
        <div className="relative h-full w-full flex items-center justify-center transform scale-[2.5]">
          <img
            src="/logo.png"
            alt="Whatooz"
            className="h-full w-full object-contain pointer-events-none drop-shadow-xs"
          />
        </div>
      </div>

      {showText && (
        <span
          className={cn(
            'font-heading font-black tracking-tight text-foreground',
            currentSize.text
          )}
        >
          <span className="text-[#fe5105]">What</span>ooz
        </span>
      )}
    </div>
  )
}
