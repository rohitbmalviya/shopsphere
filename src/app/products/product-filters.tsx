"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import type { CategoryItem } from "@/lib/actions/products";

interface ProductFiltersProps {
  categories: CategoryItem[];
  activeFilters: {
    category: string;
    search: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  };
}

export function ProductFilters({ categories, activeFilters }: ProductFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      const filters = { ...activeFilters, [key]: value };
      if (filters.category) params.set("category", filters.category);
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
      startTransition(() => router.push(`/products?${params.toString()}`));
    },
    [activeFilters, router]
  );

  const FilterContent = (
    <div className="flex flex-col gap-6">
      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sort by</Label>
        <Select
          value={activeFilters.sort || "newest"}
          onValueChange={(v) => updateFilter("sort", !v || v === "newest" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Category */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Category</Label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => updateFilter("category", "")}
            className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
              !activeFilters.category
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter("category", cat.slug)}
              className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                activeFilters.category === cat.slug
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-60">({cat.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Price Range (₹)</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="minPrice" className="sr-only">Min price</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="Min"
              defaultValue={activeFilters.minPrice}
              min={0}
              onBlur={(e) => {
                const val = e.currentTarget.value;
                if (val !== activeFilters.minPrice) updateFilter("minPrice", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.currentTarget as HTMLInputElement).value;
                  updateFilter("minPrice", val);
                }
              }}
            />
          </div>
          <span className="text-muted-foreground text-sm">–</span>
          <div className="flex-1">
            <Label htmlFor="maxPrice" className="sr-only">Max price</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Max"
              defaultValue={activeFilters.maxPrice}
              min={0}
              onBlur={(e) => {
                const val = e.currentTarget.value;
                if (val !== activeFilters.maxPrice) updateFilter("maxPrice", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.currentTarget as HTMLInputElement).value;
                  updateFilter("maxPrice", val);
                }
              }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Search */}
      <div>
        <Label htmlFor="search-filter" className="text-sm font-medium mb-2 block">Search</Label>
        <Input
          id="search-filter"
          type="search"
          placeholder="Search products..."
          defaultValue={activeFilters.search}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilter("search", (e.currentTarget as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Clear */}
      {(activeFilters.category || activeFilters.search || activeFilters.minPrice || activeFilters.maxPrice) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/products")}
          className="w-full"
        >
          Clear all filters
        </Button>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">Updating…</p>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 sticky top-24 self-start">
        <h2 className="text-base font-semibold mb-4">Filters</h2>
        {FilterContent}
      </aside>

      {/* Mobile sheet trigger */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <SlidersHorizontal size={16} />
            Filters
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-6">{FilterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
