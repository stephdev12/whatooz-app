import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none gap-1.5',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent shadow-xs',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent',
        destructive:
          'bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25',
        outline:
          'text-foreground border border-border bg-background/50 hover:bg-accent hover:text-accent-foreground',
        success:
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25',
        warning:
          'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/25',
        info:
          'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/25',
        whatooz:
          'bg-[#fe5105]/15 text-[#fe5105] border border-[#fe5105]/25 hover:bg-[#fe5105]/25',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 font-medium leading-none',
        md: 'text-xs px-2.5 py-0.5 font-medium leading-normal',
        lg: 'text-xs sm:text-sm px-3 py-1 font-semibold leading-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
}

export function Badge({
  className,
  variant,
  size,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block size-1.5 rounded-full shrink-0 animate-pulse',
            dotColor || 'bg-current'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}
