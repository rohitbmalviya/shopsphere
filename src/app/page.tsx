import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts, getCategories } from "@/lib/actions/products";
import { ProductCard } from "@/components/shared/product-card";
import { SafeImage } from "@/components/shared/safe-image";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Zap } from "lucide-react";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div className="order-2 md:order-1">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4 bg-primary/10 px-3 py-1 rounded-full">
                New Season Arrivals
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Discover Your
                <span className="block text-primary">Perfect Style</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-md">
                Curated collections, premium quality, unbeatable prices. Shop
                the latest trends and timeless classics — all in one place.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    Shop Now
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/products?sort=rating">
                  <Button size="lg" variant="outline" className="gap-2">
                    View Top Rated
                  </Button>
                </Link>
              </div>
              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 mt-8">
                {[
                  { icon: Truck, text: "Free shipping over ₹500" },
                  { icon: RotateCcw, text: "Easy 30-day returns" },
                  { icon: ShieldCheck, text: "Secure checkout" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon size={14} className="text-primary shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image collage */}
            <div className="order-1 md:order-2 relative">
              <div className="grid grid-cols-2 gap-3">
                {featured.slice(0, 4).map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className={`relative rounded-xl overflow-hidden bg-muted group ${
                      i === 0 ? "aspect-[3/4]" : "aspect-[3/4]"
                    }`}
                  >
                    <SafeImage
                      src={p.primaryImage}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 45vw, 22vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
              {/* Floating promo chip */}
              <div className="absolute -bottom-3 -left-3 bg-card border border-border rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[oklch(0.52_0.22_32)] flex items-center justify-center">
                    <Zap size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Sale Picks</p>
                    <p className="text-xs text-[oklch(0.52_0.22_32)] font-mono font-bold">Up to 40% off</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category strip ───────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Shop by Category</h2>
              <Link
                href="/products"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-x-auto">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted shrink-0">
                    <SafeImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 12vw, 10vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Featured This Week</h2>
                <p className="text-sm text-muted-foreground mt-1">Hand-picked top products</p>
              </div>
              <Link
                href="/products?sort=rating"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Promo banner ─────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl px-8 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-widest mb-2">
                Limited Time Offer
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
                Sale items up to{" "}
                <span className="text-[oklch(0.88_0.14_55)]">40% off</span>
              </h2>
              <p className="text-primary-foreground/70 mt-2 text-sm">
                Free shipping on orders over ₹500. Use code: SPHERE10
              </p>
            </div>
            <Link href="/products?sort=price_asc" className="shrink-0">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-lg"
              >
                Shop Sale <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders over ₹500" },
              { icon: ShieldCheck, title: "Secure Payment", desc: "256-bit SSL encryption" },
              { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
              { icon: Zap, title: "Fast Delivery", desc: "2-5 business days" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
