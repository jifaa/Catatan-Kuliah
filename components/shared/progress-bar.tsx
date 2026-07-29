"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  className,
  showLabel = true,
  size = "md",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getColor = () => {
    if (clampedValue === 100) return "bg-green-500";
    if (clampedValue >= 60) return "bg-blue-500";
    if (clampedValue >= 30) return "bg-yellow-500";
    return "bg-red-400";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 bg-muted rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", getColor())}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium shrink-0 w-8 text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
