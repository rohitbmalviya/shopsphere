import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getOrderById } from "@/lib/actions/orders";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  InfoIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${id.slice(-8).toUpperCase()}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/orders/${id}`);
  }

  const result = await getOrderById(id);
  if (!result.success) {
    notFound();
  }

  const order = result.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Order #{order.id.slice(-8).toUpperCase()}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground ml-11 mb-6">
        Placed on {format(new Date(order.createdAt), "dd MMMM yyyy 'at' hh:mm a")}
      </p>

      {/* Status banner */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CheckCircle2 size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Order Status</p>
          <div className="flex items-center gap-2 mt-0.5">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Mock payment notice */}
      <Alert className="mb-6 bg-primary/5 border-primary/20">
        <InfoIcon className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-muted-foreground">
          <strong className="text-foreground">Mock Payment Demo:</strong> No real money was charged. This
          order was processed through a mock payment gateway for portfolio demonstration purposes.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        {/* Main: items */}
        <div className="space-y-6">
          {/* Order items */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <Package size={16} className="text-muted-foreground" />
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPaise(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold font-mono tabular-nums shrink-0">
                    {formatPaise(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment info */}
          {order.payment && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <CreditCard size={16} className="text-muted-foreground" />
                  Payment
                </h2>
              </div>
              <div className="px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">
                    {order.payment.provider === "mock-stripe"
                      ? "Mock Stripe (Card)"
                      : "Mock Razorpay (UPI)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{order.payment.status.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono tabular-nums font-medium">
                    {formatPaise(order.payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(order.payment.createdAt), "dd MMM yyyy")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: summary + shipping */}
        <div className="space-y-4">
          {/* Order totals */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">{formatPaise(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                {order.shippingFee === 0 ? (
                  <span className="text-[oklch(0.55_0.18_145)] font-medium">Free</span>
                ) : (
                  <span className="font-mono tabular-nums">{formatPaise(order.shippingFee)}</span>
                )}
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatPaise(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-muted-foreground" />
              Shipping Address
            </h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground font-medium">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity} - {order.shippingPincode}</p>
            </div>
          </div>

          <Link href="/products">
            <Button variant="outline" className="w-full gap-2">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
