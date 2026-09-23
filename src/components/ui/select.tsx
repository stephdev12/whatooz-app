import React from 'react'
import { cn } from '@/lib/utils'

// Simplified native-like select for build to pass without Radix UI dependencies
export const Select = ({ value, onValueChange, children, ...props }: any) => {
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => {
         if (React.isValidElement(child)) {
           return React.cloneElement(child, { value, onChange: (e: any) => onValueChange?.(e.target.value) } as any)
         }
         return child
      })}
    </div>
  )
}
export const SelectTrigger = ({ children, ...props }: any) => <div className="hidden" {...props}>{children}</div>
export const SelectValue = ({ children, ...props }: any) => <span {...props}>{children}</span>
export const SelectContent = ({ children, value, onChange, ...props }: any) => {
  return (
    <select 
      value={value} 
      onChange={onChange}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      )}
      {...props}
    >
      {children}
    </select>
  )
}
export const SelectItem = ({ value, children, ...props }: any) => <option value={value} {...props}>{children}</option>
