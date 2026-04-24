import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition-colors duration-200",
        variant === "default"
          ? "border-amber-300/60 bg-amber-300 text-slate-950 hover:bg-amber-200"
          : "border-white/[0.15] bg-white/5 text-white hover:bg-white/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
