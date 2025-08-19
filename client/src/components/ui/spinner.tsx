import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        "w-4 h-4",
        className
      )}
      aria-label="Loading"
    />
  );
}
