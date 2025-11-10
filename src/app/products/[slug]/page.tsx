import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/actions/products";
import { formatPaise } from "@/lib/payments";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/shared/product-card";
import { ProductGallery } from "./product-gallery";
import { AddToCartSection } from "./add-to-cart-section";
import { ShieldCheck, Truck, RotateCcw, Star } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const isOnSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountPct = isOnSale
    ? Math.round(
        (1 - product.price / (product.compareAtPrice as number)) * 100
      )
    : 0;

  // Build images list — use picsum fallback if none
  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: "fallback",
            url: `https://picsum.photos/seed/${product.slug}/600/600`,
            position: 0,
          },
        ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 lg:gap-14">
        {/* Left: Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Right: Buy box */}
        <div className="flex flex-col">
          {/* Category badge */}
          <Link href={`/products?category=${product.category.slug}`}>
            <Badge variant="secondary" className="w-fit mb-3 text-xs">
              {product.category.name}
            </Badge>
          </Link>

          {/* Name */}
          <h1 className="text-2xl font-semibold text-foreground leading-snug">
            {product.name}
          </h1>

          {/* Rating */}
          {product.ratingAvg > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(product.ratingAvg)
                        ? "fill-[oklch(0.75_0.17_80)] text-[oklch(0.75_0.17_80)]"
                        : "fill-muted text-muted"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.ratingAvg.toFixed(1)} rating
              </span>
            </div>
          )}

          <Separator className="my-4" />

          {/* Price */}
          <div>
            {isOnSale ? (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold font-mono tabular-nums text-[oklch(0.52_0.22_32)]">
                  {formatPaise(product.price)}
                </span>
                <span className="text-sm line-through text-muted-foreground font-mono tabular-nums">
                  {formatPaise(product.compareAtPrice as number)}
                </span>
                <Badge className="bg-[oklch(0.52_0.22_32)] text-white text-xs rounded-full">
                  -{discountPct}%
                </Badge>
              </div>
            ) : (
              <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                {formatPaise(product.price)}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
          </div>

          <Separator className="my-4" />

          {/* Stock */}
          <div className="mb-4">
            {isOutOfStock ? (
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                Out of Stock
              </p>
            ) : isLowStock ? (
              <p className="text-sm font-medium text-[oklch(0.62_0.19_55)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[oklch(0.62_0.19_55)] inline-block" />
                Only {product.stock} left in stock — order soon!
              </p>
            ) : (
              <p className="text-sm font-medium text-[oklch(0.55_0.18_145)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.18_145)] inline-block" />
                In Stock
              </p>
            )}
          </div>

          {/* Add to cart + qty */}
          <AddToCartSection product={product} />

          <Separator className="my-4" />

          {/* Trust signals */}
          <div className="flex flex-col gap-3">
            {[
              { icon: Truck, text: "Free delivery on orders over ₹500" },
              { icon: RotateCcw, text: "Easy 30-day returns" },
              { icon: ShieldCheck, text: "Secure checkout — 256-bit SSL" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon size={15} className="text-primary shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Description */}
          <div>
            <h2 className="text-base font-semibold mb-2">About this product</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related products */}
      {product.related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
