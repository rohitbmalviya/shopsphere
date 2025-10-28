"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/shared/safe-image";
import { addToCart } from "@/lib/actions/cart";
import { formatPaise } from "@/lib/payments";
import type { ProductListItem } from "@/lib/actions/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const isOnSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const isOutOfStock = product.stock === 0;

  const discountPct = isOnSale
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      const result = await addToCart(product.id, 1);
      if (result.success) {
        toast.success(`${product.name} added to cart`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image container */}
      <div className="relative overflow-hidden rounded-xl aspect-[4/5] bg-muted">
        <SafeImage
          src={product.primaryImage}
          alt={`${product.name} — ${product.category.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isOutOfStock && "opacity-60 grayscale"
          )}
        />

        {/* Badge: sale or out-of-stock */}
        {isOutOfStock ? (
          <span className="absolute top-2 left-2 z-10 bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide border border-border">
            Out of Stock
          </span>
        ) : isOnSale ? (
          <span className="absolute top-2 left-2 z-10 bg-[oklch(0.52_0.22_32)] text-white text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
            -{discountPct}%
          </span>
        ) : null}

        {/* Hover Add to Cart — desktop */}
        <div className="absolute bottom-0 inset-x-0 z-10 hidden sm:block">
          <Button
            size="sm"
            className="w-full rounded-b-xl rounded-t-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={14} className="mr-1.5" />
            {adding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {product.name}
        </p>

        {/* Rating */}
        {product.ratingAvg > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star
              size={12}
              className="fill-[oklch(0.75_0.17_80)] text-[oklch(0.75_0.17_80)]"
            />
            <span className="text-xs text-muted-foreground">
              {product.ratingAvg.toFixed(1)}
            </span>
          </div>
        )}

        {/* Price row */}
        {isOnSale ? (
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-semibold font-mono text-[oklch(0.52_0.22_32)]">
              {formatPaise(product.price)}
            </span>
            <span className="text-sm line-through text-muted-foreground font-mono">
              {formatPaise(product.compareAtPrice as number)}
            </span>
          </div>
        ) : (
          <p className="text-lg font-semibold font-mono text-foreground mt-2">
            {formatPaise(product.price)}
          </p>
        )}
      </div>

      {/* Mobile CTA (always visible) */}
      <div className="mt-2 sm:hidden">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart size={14} className="mr-1.5" />
          {isOutOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
        <div className="h-5 bg-muted animate-pulse rounded w-1/3" />
      </div>
    </div>
  );
}
