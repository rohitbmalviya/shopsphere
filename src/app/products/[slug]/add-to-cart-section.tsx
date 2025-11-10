"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import type { ProductDetail } from "@/lib/actions/products";

interface AddToCartSectionProps {
  product: Pick<ProductDetail, "id" | "name" | "stock">;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const result = await addToCart(product.id, qty);
      if (result.success) {
        toast.success(`${qty} × ${product.name} added to cart`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setBuyingNow(true);
    try {
      const result = await addToCart(product.id, qty);
      if (result.success) {
        router.push("/cart");
      } else {
        toast.error(result.error);
        setBuyingNow(false);
      }
    } catch {
      setBuyingNow(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Qty picker */}
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Qty:</span>
          <div
            className="flex items-center border border-border rounded-lg overflow-hidden"
            role="group"
            aria-label="Quantity"
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              aria-valuemin={1}
              className="w-10 h-10 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={14} />
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="w-12 text-center text-sm font-medium tabular-nums"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              aria-label="Increase quantity"
              aria-valuemax={product.stock}
              className="w-10 h-10 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {product.stock} available
          </span>
        </div>
      )}

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleAddToCart}
        disabled={isOutOfStock || addingToCart}
        aria-disabled={isOutOfStock}
      >
        <ShoppingCart size={18} />
        {addingToCart
          ? "Adding..."
          : isOutOfStock
          ? "Out of Stock"
          : "Add to Cart"}
      </Button>

      {/* Buy Now */}
      {!isOutOfStock && (
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          onClick={handleBuyNow}
          disabled={buyingNow}
        >
          <Zap size={18} />
          {buyingNow ? "Loading..." : "Buy Now"}
        </Button>
      )}
    </div>
  );
}
