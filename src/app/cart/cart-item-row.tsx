"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/shared/safe-image";
import { updateCartItemQty, removeFromCart } from "@/lib/actions/cart";
import { formatPaise } from "@/lib/payments";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLineItem } from "@/lib/actions/cart";

interface CartItemRowProps {
  item: CartLineItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const router = useRouter();
  const [qty, setQty] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQtyChange = async (newQty: number) => {
    if (newQty === qty || updating) return;
    setUpdating(true);
    const prev = qty;
    setQty(newQty);
    try {
      const result = await updateCartItemQty(item.product.id, newQty);
      if (!result.success) {
        toast.error(result.error);
        setQty(prev);
      } else {
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const result = await removeFromCart(item.product.id);
      if (result.success) {
        toast.success(`${item.product.name} removed from cart`);
        router.refresh();
      } else {
        toast.error(result.error);
        setRemoving(false);
      }
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className={`flex gap-4 p-4 transition-opacity ${removing ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Product image */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0 hover:opacity-90 transition-opacity"
        aria-label={`View ${item.product.name}`}
      >
        <SafeImage
          src={item.product.primaryImage}
          alt={item.product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
          >
            {item.product.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={handleRemove}
            disabled={removing}
            aria-label={`Remove ${item.product.name} from cart`}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Qty stepper */}
          <div
            className="flex items-center border border-border rounded-md overflow-hidden"
            role="group"
            aria-label={`Quantity for ${item.product.name}`}
          >
            <button
              type="button"
              onClick={() => handleQtyChange(qty - 1)}
              disabled={qty <= 1 || updating}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(qty + 1)}
              disabled={qty >= item.product.stock || updating}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Line total */}
          <span className="text-sm font-semibold font-mono tabular-nums">
            {formatPaise(item.product.price * qty)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          {formatPaise(item.product.price)} each
        </p>
      </div>
    </div>
  );
}
