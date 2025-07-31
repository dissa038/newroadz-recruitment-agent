"use client";

import { cn } from "@/lib/utils";

interface CustomSwiperPaginationProps {
  total: number;
  current: number;
  onSlideChange: (index: number) => void;
  className?: string;
}

export function CustomSwiperPagination({ 
  total, 
  current, 
  onSlideChange, 
  className 
}: CustomSwiperPaginationProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 mt-6", className)}>
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          onClick={() => onSlideChange(index)}
          className={cn(
            "relative h-2 rounded-full transition-all duration-300 ease-in-out",
            "hover:bg-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
            current === index 
              ? "w-8 bg-primary" 
              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
          aria-label={`Ga naar slide ${index + 1}`}
        />
      ))}
    </div>
  );
}