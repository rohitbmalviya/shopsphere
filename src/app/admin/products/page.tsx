import { adminListProducts } from "@/lib/actions/admin";
import { getCategories } from "@/lib/actions/products";
import { AdminProductsClient } from "./admin-products-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Products",
};

export default async function AdminProductsPage() {
  const [productsResult, categoriesResult] = await Promise.all([
    adminListProducts(),
    getCategories(),
  ]);

  const products = productsResult.success ? productsResult.data : [];
  const categories = categoriesResult;

  return (
    <div className="p-6 lg:p-8">
      <AdminProductsClient
        initialProducts={products}
        categories={categories}
      />
    </div>
  );
}
