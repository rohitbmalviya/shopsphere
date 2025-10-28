import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  },
  PAID: {
    label: "Paid",
    className: "bg-[oklch(0.55_0.18_145)/15] text-[oklch(0.38_0.18_145)] border-[oklch(0.55_0.18_145)/30]",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-secondary text-secondary-foreground border-border",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-xs font-medium uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
