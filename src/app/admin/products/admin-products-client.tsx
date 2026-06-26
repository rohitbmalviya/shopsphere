"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SafeImage } from "@/components/shared/safe-image";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/admin";
import { formatPaise } from "@/lib/payments";
import { Pencil, Trash2, Plus, Search, Loader2, AlertTriangle } from "lucide-react";
import type { AdminProductItem, ProductInput } from "@/lib/actions/admin";
import type { CategoryItem } from "@/lib/actions/products";

interface AdminProductsClientProps {
  initialProducts: AdminProductItem[];
  categories: CategoryItem[];
}

interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  featured: boolean;
  ratingAvg: string;
  imageUrls: string;
}

export function AdminProductsClient({
  initialProducts,
  categories,
}: AdminProductsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProductItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<ProductFormValues>({
      defaultValues: {
        name: "",
        slug: "",
        description: "",
        price: "",
        compareAtPrice: "",
        stock: "",
        categoryId: "",
        featured: false,
        ratingAvg: "0",
        imageUrls: "",
      },
    });

  const watchedFeatured = watch("featured");

  const openCreate = () => {
    setEditProduct(null);
    reset({
      name: "",
      slug: "",
      description: "",
      price: "",
      compareAtPrice: "",
      stock: "",
      categoryId: categories[0]?.id ?? "",
      featured: false,
      ratingAvg: "0",
      imageUrls: "",
    });
    setSheetOpen(true);
  };

  const openEdit = (product: AdminProductItem) => {
    setEditProduct(product);
    reset({
      name: product.name,
      slug: product.slug,
      description: "",
      price: String(product.price / 100),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice / 100) : "",
      stock: String(product.stock),
      categoryId: product.category.id,
      featured: product.featured,
      ratingAvg: String(product.ratingAvg),
      imageUrls: product.primaryImage ?? "",
    });
    setSheetOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const priceRupees = parseFloat(values.price);
      const compareRupees = values.compareAtPrice ? parseFloat(values.compareAtPrice) : null;
      const input: ProductInput = {
        name: values.name,
        slug: values.slug,
        description: values.description || `${values.name} — premium quality product.`,
        price: Math.round(priceRupees * 100),
        compareAtPrice: compareRupees ? Math.round(compareRupees * 100) : null,
        stock: parseInt(values.stock),
        categoryId: values.categoryId,
        featured: values.featured,
        ratingAvg: parseFloat(values.ratingAvg) || 0,
        imageUrls: values.imageUrls
          ? values.imageUrls.split(",").map((u) => u.trim()).filter(Boolean)
          : undefined,
      };

      const result = editProduct
        ? await updateProduct(editProduct.id, input)
        : await createProduct(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(editProduct ? "Product updated" : "Product created");
      setSheetOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteProduct(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.data.deleted) {
        toast.warning(result.data.message);
      } else {
        toast.success("Product deleted");
        startTransition(() => router.refresh());
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = search
    ? initialProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.name.toLowerCase().includes(search.toLowerCase())
      )
    : initialProducts;

  const stockColor = (stock: number) => {
    if (stock <= 5) return "text-destructive font-semibold";
    if (stock <= 20) return "text-[oklch(0.62_0.19_55)] font-medium";
    return "text-foreground";
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{initialProducts.length} total products</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          New Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-3">Product</th>
                <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-3">Category</th>
                <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-3">Price</th>
                <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-3">Stock</th>
                <th scope="col" className="text-center font-medium text-muted-foreground px-4 py-3">Featured</th>
                <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                          <SafeImage
                            src={product.primaryImage}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {product.category.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatPaise(product.price)}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${stockColor(product.stock)}`}>
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.featured ? (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteTarget(product);
                            setDeleteDialogOpen(true);
                          }}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editProduct ? "Edit Product" : "New Product"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name *</Label>
              <Input id="p-name" {...register("name", { required: true })} placeholder="Product name" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-slug">Slug *</Label>
              <Input id="p-slug" {...register("slug", { required: true })} placeholder="product-slug" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <textarea
                id="p-desc"
                {...register("description")}
                placeholder="Product description (optional)"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (₹) *</Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  {...register("price", { required: true })}
                  placeholder="999"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-compare">Compare At (₹)</Label>
                <Input
                  id="p-compare"
                  type="number"
                  step="0.01"
                  {...register("compareAtPrice")}
                  placeholder="1299 (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock *</Label>
                <Input
                  id="p-stock"
                  type="number"
                  {...register("stock", { required: true })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-rating">Rating (0-5)</Label>
                <Input
                  id="p-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  {...register("ratingAvg")}
                  placeholder="4.2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category *</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", !v ? "" : v)}
              >
                <SelectTrigger id="p-cat">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-images">Image URLs (comma-separated)</Label>
              <Input
                id="p-images"
                {...register("imageUrls")}
                placeholder="https://picsum.photos/seed/my-product/600/600"
              />
              <p className="text-xs text-muted-foreground">Replaces existing images on update</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="p-featured"
                checked={watchedFeatured}
                onCheckedChange={(v) => setValue("featured", v)}
              />
              <Label htmlFor="p-featured">Featured product</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 size={15} className="animate-spin mr-2" /> Saving…</>
                ) : (
                  editProduct ? "Update Product" : "Create Product"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              If the product has existing orders, it cannot be deleted — set stock to 0 instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 size={15} className="animate-spin mr-2" /> Deleting…</>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
