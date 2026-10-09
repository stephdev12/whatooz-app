"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlideMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  highlightClassName?: string;
  children: React.ReactNode;
}

export function GlideMenu({ className, children, ...props }: GlideMenuProps) {
  return (
    <div className={cn("relative flex flex-col", className)} {...props}>
      {children}
    </div>
  );
}

export default GlideMenu;
