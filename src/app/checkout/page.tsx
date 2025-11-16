import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCart } from "@/lib/actions/cart";
import { formatPaise } from "@/lib/payments";
import { Separator } from "@/components/ui/separator";
import { CheckoutForm } from "./checkout-form";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
};

const SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 4900;

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/checkout");
  }

  const cart = await getCart();
  if (cart.items.length === 0) {
    redirect("/cart");
  }

  const shippingFee = cart.subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = cart.subtotal + shippingFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Left: Shipping form */}
        <div>
          <CheckoutForm />
        </div>

        {/* Right: Order summary */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-base font-semibold mb-4">Order Summary</h2>

            {/* Line items (collapsed) */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="relative w-10 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {item.product.primaryImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.primaryImage}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono tabular-nums text-xs shrink-0">
                    {formatPaise(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">{formatPaise(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                {shippingFee === 0 ? (
                  <span className="text-[oklch(0.55_0.18_145)] font-medium">Free</span>
                ) : (
                  <span className="font-mono tabular-nums">{formatPaise(shippingFee)}</span>
                )}
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-xl font-bold font-mono tabular-nums">{formatPaise(total)}</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <ShieldCheck size={12} className="text-primary" />
              Secured with 256-bit encryption
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            This is a portfolio demo.{" "}
            <Link href="#" className="underline">No real payments</Link> are processed.
          </p>
        </div>
      </div>
    </div>
  );
}
