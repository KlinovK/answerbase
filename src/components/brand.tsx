import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  href?: string;
};

export function Brand({ className, href = "/" }: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="Answerbase home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
      >
        A
      </span>
      <span>Answerbase</span>
    </Link>
  );
}
