'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface VariableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const VariableTextarea = React.forwardRef<HTMLTextAreaElement, VariableTextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const overlay = e.currentTarget.previousElementSibling as HTMLDivElement;
      if (overlay) {
        overlay.scrollTop = e.currentTarget.scrollTop;
        overlay.scrollLeft = e.currentTarget.scrollLeft;
      }
    };

    const renderHighlightedText = (text: string) => {
      if (!text) return null;
      // Split by {{...}} and wrap variables in spans
      const parts = text.split(/(\{\{[^}]+\}\})/g);
      return parts.map((part, i) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          return (
            <span key={i} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded px-0.5">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div className={cn("relative w-full rounded-md border border-input bg-background", className)}>
        <div 
          className="absolute inset-0 pointer-events-none p-3 overflow-hidden break-words whitespace-pre-wrap text-sm z-0"
          aria-hidden="true"
        >
          {renderHighlightedText(value)}
          {value.endsWith('\n') ? <br /> : null}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          className="relative z-10 w-full min-h-[100px] resize-y bg-transparent p-3 text-sm text-transparent caret-black dark:caret-white outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
          spellCheck={false}
          {...props}
        />
      </div>
    )
  }
)
VariableTextarea.displayName = 'VariableTextarea'
