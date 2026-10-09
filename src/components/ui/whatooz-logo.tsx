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
  variant = 'auto',
}: WhatoozLogoProps) {
  // Dimensions for the icon container
  const sizeMap = {
    sm: { container: 'h-8 w-8', text: 'text-base' },
    md: { container: 'h-9 w-9', text: 'text-lg' },
    lg: { container: 'h-11 w-11', text: 'text-xl' },
    xl: { container: 'h-14 w-14', text: 'text-2xl' },
  }

  const currentSize = sizeMap[size]

  const isLightOnly = variant === 'light'
  const isDarkOnly = variant === 'dark'

  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      {/* Real Logo */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 overflow-hidden',
          currentSize.container
        )}
      >
        {/* Light background version: dark mark */}
        {(isLightOnly || variant === 'auto') && (
          <img
            src="/logo_white.png"
            alt="Whatooz"
            className={cn(
              'h-full w-full object-contain pointer-events-none transform scale-200',
              variant === 'auto' ? 'block dark:hidden' : 'block'
            )}
          />
        )}
        {/* Dark background version: white mark */}
        {(isDarkOnly || variant === 'auto') && (
          <img
            src="/logo_noir.png"
            alt="Whatooz"
            className={cn(
              'h-full w-full object-contain pointer-events-none transform scale-200',
              variant === 'auto' ? 'hidden dark:block' : 'block'
            )}
          />
        )}
      </div>

      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight leading-none',
            currentSize.text,
            isDarkOnly
              ? 'text-white'
              : isLightOnly
                ? 'text-zinc-900'
                : 'text-foreground'
          )}
        >
          whatooz
        </span>
      )}
    </div>
  )
}
