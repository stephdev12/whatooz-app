"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function EntityChip({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-[5px] bg-inset border border-line text-[12px] font-medium text-ink align-middle",
        className
      )}
    >
      {name}
    </span>
  );
}

export default EntityChip;
