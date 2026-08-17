import { FolderLockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  compact?: boolean;
}

const Brand = ({ className, compact = false }: BrandProps) => (
  <div className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground ring-1 ring-primary/25">
      <FolderLockIcon aria-hidden="true" className="size-5" />
    </span>
    <span className="truncate text-base leading-none font-semibold tracking-tight">
      <span className="text-accent-foreground">Cyan</span>
      <span className={cn(compact && "max-sm:sr-only")}> Data Room</span>
    </span>
  </div>
);

export default Brand;
