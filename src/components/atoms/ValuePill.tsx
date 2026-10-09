"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ValuePill({
  tone,
  children,
  className,
}: {
  tone?: "green" | "orange" | "red" | string;
  children: React.ReactNode;
  className?: string;
}) {
  const toneStyle =
    tone === "green"
      ? "bg-green-tint text-green"
      : tone === "orange"
      ? "bg-orange-tint text-orange"
      : tone === "red"
      ? "bg-red-tint text-red"
      : "bg-inset text-ink";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium align-middle",
        toneStyle,
        className
      )}
    >
      {children}
    </span>
  );
}

export default ValuePill;
