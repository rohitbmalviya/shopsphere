import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/actions/products";
import { ProductCard, ProductCardSkeleton } from "@/components/shared/product-card";
import { ProductFilters } from "./product-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our full collection of premium products.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const sort = (params.sort as "price_asc" | "price_desc" | "newest" | "rating") || "newest";

  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: params.category || undefined,
      search: params.search || undefined,
      minPrice: params.minPrice ? parseInt(params.minPrice) * 100 : undefined,
      maxPrice: params.maxPrice ? parseInt(params.maxPrice) * 100 : undefined,
      sort,
    }),
    getCategories(),
  ]);

  const activeFilters = {
    category: params.category || "",
    search: params.search || "",
    minPrice: params.minPrice || "",
    maxPrice: params.maxPrice || "",
    sort,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <ProductFilters categories={categories} activeFilters={activeFilters} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {params.category
                  ? categories.find((c) => c.slug === params.category)?.name ?? "Products"
                  : params.search
                  ? `Search: "${params.search}"`
                  : "All Products"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {products.length} {products.length === 1 ? "product" : "products"} found
              </p>
            </div>
          </div>

          {/* Active filter chips */}
          <ActiveFilterChips params={params} />

          {/* Grid */}
          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            {products.length === 0 ? (
              <EmptyState hasFilters={!!(params.category || params.search || params.minPrice || params.maxPrice)} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ActiveFilterChips({
  params,
}: {
  params: {
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}) {
  const chips: { label: string; removeKey: string }[] = [];
  if (params.category) chips.push({ label: `Category: ${params.category}`, removeKey: "category" });
  if (params.search) chips.push({ label: `Search: ${params.search}`, removeKey: "search" });
  if (params.minPrice) chips.push({ label: `Min: ₹${params.minPrice}`, removeKey: "minPrice" });
  if (params.maxPrice) chips.push({ label: `Max: ₹${params.maxPrice}`, removeKey: "maxPrice" });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => {
        const newParams = new URLSearchParams();
        if (params.category && chip.removeKey !== "category") newParams.set("category", params.category);
        if (params.search && chip.removeKey !== "search") newParams.set("search", params.search);
        if (params.minPrice && chip.removeKey !== "minPrice") newParams.set("minPrice", params.minPrice);
        if (params.maxPrice && chip.removeKey !== "maxPrice") newParams.set("maxPrice", params.maxPrice);
        if (params.sort) newParams.set("sort", params.sort);
        const href = `/products?${newParams.toString()}`;
        return (
          <a
            key={chip.label}
            href={href}
            className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full hover:bg-secondary/70 transition-colors"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </a>
        );
      })}
      <a
        href="/products"
        className="text-xs font-medium text-muted-foreground hover:text-foreground underline self-center"
      >
        Clear all
      </a>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">No products found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {hasFilters
          ? "Try adjusting your filters to find what you're looking for."
          : "No products are available right now."}
      </p>
      {hasFilters && (
        <a
          href="/products"
          className="mt-4 inline-flex items-center justify-center text-sm font-medium text-primary hover:underline"
        >
          Clear all filters
        </a>
      )}
    </div>
  );
}
