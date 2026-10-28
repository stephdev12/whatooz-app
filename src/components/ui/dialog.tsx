'use client'

import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = BaseDialog.Root

export const DialogTrigger = BaseDialog.Trigger

export const DialogPortal = BaseDialog.Portal

export const DialogClose = BaseDialog.Close

export interface DialogPopupProps
  extends React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> {
  showCloseButton?: boolean
}

export const DialogBackdrop = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Backdrop>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    data-slot="dialog-backdrop"
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
      className
    )}
    {...props}
  />
))
DialogBackdrop.displayName = 'DialogBackdrop'

export const DialogPopup = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Popup>,
  DialogPopupProps
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdrop />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <BaseDialog.Popup
        ref={ref}
        data-slot="dialog-popup"
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all duration-200 outline-none flex flex-col max-h-[90vh] overflow-hidden data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <BaseDialog.Close
            data-slot="dialog-close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </div>
  </DialogPortal>
))
DialogPopup.displayName = 'DialogPopup'

export const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-header"
    className={cn('flex flex-col gap-1.5 p-5 sm:p-6 pb-2', className)}
    {...props}
  />
))
DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Title>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Description>,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn('text-xs sm:text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export const DialogPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-panel"
    className={cn('flex-1 overflow-y-auto p-5 sm:p-6 py-2', className)}
    {...props}
  />
))
DialogPanel.displayName = 'DialogPanel'

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'bare' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-footer"
    className={cn(
      'flex items-center justify-end gap-2 p-4 sm:p-6 pt-3',
      variant === 'default' && 'border-t border-border bg-muted/20',
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = 'DialogFooter'
