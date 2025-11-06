'use server'
// ============================================================
// ShopSphere — Storefront product actions
//
// All functions are read-only (no auth required).
// They are safe to call from Server Components and Client
// Components alike (via server action boundary).
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductListItem = {
  id: string
  name: string
  slug: string
  price: number         // paise
  compareAtPrice: number | null // paise — null when not on sale
  stock: number
  featured: boolean
  ratingAvg: number
  category: {
    id: string
    name: string
    slug: string
  }
  primaryImage: string | null  // url of position=0 image, or null
}

export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice: number | null
  stock: number
  featured: boolean
  ratingAvg: number
  category: {
    id: string
    name: string
    slug: string
  }
  images: Array<{ id: string; url: string; position: number }>
  related: ProductListItem[]
}

export type CategoryItem = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  productCount: number
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const GetProductsSchema = z.object({
  categorySlug: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().int().min(0).optional(),  // paise
  maxPrice: z.number().int().min(0).optional(),  // paise
  sort: z
    .enum(['price_asc', 'price_desc', 'newest', 'rating'])
    .optional()
    .default('newest'),
})

export type GetProductsInput = z.input<typeof GetProductsSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Picks the primary image (lowest position) url from an images array. */
function primaryImageUrl(
  images: Array<{ url: string; position: number }>
): string | null {
  if (images.length === 0) return null
  const sorted = [...images].sort((a, b) => a.position - b.position)
  return sorted[0].url
}

/** Maps a raw Prisma product row (with images + category) to ProductListItem. */
function toListItem(
  p: {
    id: string
    name: string
    slug: string
    price: number
    compareAtPrice: number | null
    stock: number
    featured: boolean
    ratingAvg: number
    category: { id: string; name: string; slug: string }
    images: Array<{ url: string; position: number }>
  }
): ProductListItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    featured: p.featured,
    ratingAvg: p.ratingAvg,
    category: p.category,
    primaryImage: primaryImageUrl(p.images),
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Returns a filtered + sorted list of products for the storefront.
 * All filters are optional. Prices in paise.
 */
export async function getProducts(
  input: GetProductsInput = {}
): Promise<ProductListItem[]> {
  const parsed = GetProductsSchema.safeParse(input)
  if (!parsed.success) {
    return []
  }
  const { categorySlug, search, minPrice, maxPrice, sort } = parsed.data

  // Resolve categoryId from slug if provided
  let categoryId: string | undefined
  if (categorySlug) {
    const cat = await db.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    })
    if (!cat) return [] // unknown category slug → empty result
    categoryId = cat.id
  }

  const products = await db.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
      ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
    },
    orderBy:
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
        ? { price: 'desc' }
        : sort === 'rating'
        ? { ratingAvg: 'desc' }
        : { createdAt: 'desc' }, // newest (default)
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      featured: true,
      ratingAvg: true,
      category: { select: { id: true, name: true, slug: true } },
      images: { select: { url: true, position: true } },
    },
  })

  return products.map(toListItem)
}

/**
 * Returns full product detail (including all images + 4 related products).
 * Returns null when the slug doesn't exist.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const product = await db.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      featured: true,
      ratingAvg: true,
      categoryId: true,
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: { id: true, url: true, position: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!product) return null

  // Fetch a few related products from the same category, excluding this product
  const relatedRaw = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      slug: { not: slug },
    },
    take: 4,
    orderBy: { ratingAvg: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      featured: true,
      ratingAvg: true,
      category: { select: { id: true, name: true, slug: true } },
      images: { select: { url: true, position: true } },
    },
  })

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    featured: product.featured,
    ratingAvg: product.ratingAvg,
    category: product.category,
    images: product.images,
    related: relatedRaw.map(toListItem),
  }
}

/**
 * Returns all categories with a product count each.
 */
export async function getCategories(): Promise<CategoryItem[]> {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { products: true } },
    },
  })

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }))
}

/**
 * Returns featured products up to `limit` (default 8).
 * Ordered by rating descending so the best-rated featured products appear first.
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductListItem[]> {
  const products = await db.product.findMany({
    where: { featured: true },
    take: limit,
    orderBy: { ratingAvg: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      featured: true,
      ratingAvg: true,
      category: { select: { id: true, name: true, slug: true } },
      images: { select: { url: true, position: true } },
    },
  })

  return products.map(toListItem)
}
