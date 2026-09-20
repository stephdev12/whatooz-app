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
      {/* Real Logo */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0',
          currentSize.container
        )}
      >
        <img
          src="/logo_white.png"
          alt="Whatooz"
          className="h-full w-full object-contain pointer-events-none transform scale-200 block dark:hidden"
        />
        <img
          src="/logo_noir.png"
          alt="Whatooz"
          className="h-full w-full object-contain pointer-events-none transform scale-200 hidden dark:block"
        />
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
