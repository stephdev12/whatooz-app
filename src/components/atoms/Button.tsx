"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "ghost" | "accent" | "secondary" | "success" | "primary";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    ghost: "text-ink-3 hover:text-ink hover:bg-hover active:scale-98",
    accent: "bg-[#fe5105] text-white hover:bg-[#e04500] shadow-xs active:scale-98 disabled:opacity-40",
    primary: "bg-ink text-surface hover:opacity-90 shadow-xs active:scale-98 disabled:opacity-40",
    secondary: "bg-surface border border-line text-ink hover:bg-hover active:scale-98 disabled:opacity-40",
    success: "bg-green text-white hover:opacity-90 shadow-xs active:scale-98 disabled:opacity-40",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-[12px] rounded-control",
    md: "px-3 py-1.5 text-[13px] rounded-control",
    lg: "px-4 py-2 text-[14px] rounded-card",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
