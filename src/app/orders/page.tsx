import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getMyOrders } from "@/lib/actions/orders";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/orders");
  }

  const result = await getMyOrders();
  const orders = result.success ? result.data : [];

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">My Orders</h1>
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <ShoppingBag size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            You haven&apos;t placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link href="/products" className="mt-6">
            <Button size="lg" className="h-11 px-6 gap-2">
              Browse Products
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        My Orders
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({orders.length} {orders.length === 1 ? "order" : "orders"})
        </span>
      </h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="group bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <OrderStatusBadge status={order.status} />
                <p className="text-base font-bold font-mono tabular-nums">
                  {formatPaise(order.total)}
                </p>
              </div>
            </div>

            {order.payment && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                Payment: {order.payment.provider === "mock-stripe" ? "Mock Stripe" : "Mock Razorpay"} ·{" "}
                {order.payment.status}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary group-hover:gap-2 transition-all">
              View details <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
