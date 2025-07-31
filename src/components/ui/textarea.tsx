import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[150px] w-full border-0 border-b border-input bg-background px-3 py-2",
        "text-sm transition-colors placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 rounded-none resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
