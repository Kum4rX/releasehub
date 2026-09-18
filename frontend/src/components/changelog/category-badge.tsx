import { Badge } from "@/components/ui/badge";
import { categoryMeta, type Category } from "@/data/mock";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
  withDot = true,
}: {
  category: Category;
  className?: string;
  withDot?: boolean;
}) {
  const meta = categoryMeta[category];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-2 py-0.5 text-label", meta.tone, className)}
    >
      {withDot ? <span className={cn("size-1.5 rounded-full", meta.dot)} /> : null}
      {meta.label}
    </Badge>
  );
}
