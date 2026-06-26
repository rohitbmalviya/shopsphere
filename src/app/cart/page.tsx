import Link from "next/link";
import { getCart } from "@/lib/actions/cart";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItemRow } from "./cart-item-row";
import { ShoppingCart, ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
};

const SHIPPING_THRESHOLD = 50000; // ₹500 in paise
const SHIPPING_FEE = 4900; // ₹49 in paise

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <ShoppingCart size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Looks like you haven&apos;t added anything yet. Browse our products and find something you love.
          </p>
          <Link href="/products" className="mt-6">
            <Button size="lg" className="h-11 px-6 gap-2">
              Start Shopping
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shippingFee = cart.subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = cart.subtotal + shippingFee;
  const remainingForFreeShipping = SHIPPING_THRESHOLD - cart.subtotal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Line items */}
        <div className="flex flex-col">
          {/* Free shipping progress */}
          {remainingForFreeShipping > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-foreground">
                Add{" "}
                <span className="font-semibold text-primary font-mono">
                  {formatPaise(remainingForFreeShipping)}
                </span>{" "}
                more to get <span className="font-semibold">free shipping</span>
              </p>
              <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cart.subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {cart.items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Order summary — sticky on desktop */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                <span className="font-mono tabular-nums">{formatPaise(cart.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                {shippingFee === 0 ? (
                  <span className="text-[oklch(0.55_0.18_145)] font-medium">Free</span>
                ) : (
                  <span className="font-mono tabular-nums">{formatPaise(shippingFee)}</span>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold font-mono tabular-nums">{formatPaise(total)}</span>
            </div>

            <Link href="/checkout" className="block mt-4">
              <Button size="lg" className="h-11 px-6 w-full gap-2">
                Proceed to Checkout
                <ArrowRight size={16} />
              </Button>
            </Link>

            <Link href="/products" className="block mt-2">
              <Button variant="ghost" size="sm" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <ShieldCheck size={12} className="text-primary" />
              Secure checkout — 256-bit SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
