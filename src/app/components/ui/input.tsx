import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input({ className, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        // Hairline field on paper, like the page. Placeholders are italic so an example never reads as a filled-in value.
        "file:text-foreground placeholder:italic placeholder:text-ink-soft selection:bg-primary selection:text-primary-foreground border-rule flex h-10 w-full min-w-0 rounded-sm border px-3 py-1 text-base bg-panel text-ink outline-none hover:border-ink file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
});

export { Input };
