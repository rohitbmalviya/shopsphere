'use server'
// ============================================================
// ShopSphere — Cart server actions
//
// All mutations require authentication (requireUser).
// Cart state is stored in the DB as CartItem rows.
// UPSERT pattern: addToCart increments qty instead of creating
// a duplicate row (enforced by @@unique([userId, productId])).
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartLineItem = {
  id: string          // CartItem.id
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number     // paise — unit price
    stock: number
    primaryImage: string | null
  }
  lineTotal: number   // paise — price * quantity
}

export type CartSummary = {
  items: CartLineItem[]
  subtotal: number    // paise
  itemCount: number   // total quantity across all lines
}

export type CartActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildCartSummary(userId: string): Promise<CartSummary> {
  const rawItems = await db.cartItem.findMany({
    where: { userId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          images: {
            select: { url: true, position: true },
            orderBy: { position: 'asc' },
            take: 1,
          },
        },
      },
    },
  })

  const items: CartLineItem[] = rawItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      stock: item.product.stock,
      primaryImage: item.product.images[0]?.url ?? null,
    },
    lineTotal: item.product.price * item.quantity,
  }))

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return { items, subtotal, itemCount }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Returns the current user's cart with line items, totals, and item count.
 * Returns an empty cart for unauthenticated users instead of throwing.
 */
export async function getCart(): Promise<CartSummary> {
  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { items: [], subtotal: 0, itemCount: 0 }
  }

  return buildCartSummary(userId)
}

/**
 * Adds a product to the cart (UPSERT — increments quantity if already present).
 * Validates stock availability before adding.
 */
export async function addToCart(
  productId: string,
  qty = 1
): Promise<CartActionResult<{ itemCount: number }>> {
  // Validate input
  const productIdParsed = z.string().cuid().safeParse(productId)
  const qtyParsed = z.number().int().min(1).max(100).safeParse(qty)
  if (!productIdParsed.success || !qtyParsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'You must be logged in to add items to cart' }
  }

  // Fetch product to check stock
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true, name: true },
  })

  if (!product) {
    return { success: false, error: 'Product not found' }
  }

  // Check existing cart quantity
  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { quantity: true },
  })

  const currentQty = existing?.quantity ?? 0
  const newQty = currentQty + qty

  if (newQty > product.stock) {
    return {
      success: false,
      error: `Only ${product.stock} units of "${product.name}" available (you have ${currentQty} in cart)`,
    }
  }

  // UPSERT — increment if exists, create if not
  await db.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity: qty },
    update: { quantity: { increment: qty } },
  })

  // Return updated item count
  const summary = await buildCartSummary(userId)
  return { success: true, data: { itemCount: summary.itemCount } }
}

/**
 * Sets the quantity of a specific cart item to an exact value.
 * Pass qty=0 to remove the item.
 */
export async function updateCartItemQty(
  productId: string,
  qty: number
): Promise<CartActionResult<CartSummary>> {
  const productIdParsed = z.string().cuid().safeParse(productId)
  const qtyParsed = z.number().int().min(0).max(100).safeParse(qty)
  if (!productIdParsed.success || !qtyParsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  if (qty === 0) {
    // Remove the item
    await db.cartItem.deleteMany({
      where: { userId, productId },
    })
    return { success: true, data: await buildCartSummary(userId) }
  }

  // Check stock
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true, name: true },
  })

  if (!product) {
    return { success: false, error: 'Product not found' }
  }

  if (qty > product.stock) {
    return {
      success: false,
      error: `Only ${product.stock} units of "${product.name}" available`,
    }
  }

  await db.cartItem.updateMany({
    where: { userId, productId },
    data: { quantity: qty },
  })

  return { success: true, data: await buildCartSummary(userId) }
}

/**
 * Removes a single product from the cart entirely.
 */
export async function removeFromCart(
  productId: string
): Promise<CartActionResult<CartSummary>> {
  const productIdParsed = z.string().cuid().safeParse(productId)
  if (!productIdParsed.success) {
    return { success: false, error: 'Invalid product ID' }
  }

  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  await db.cartItem.deleteMany({
    where: { userId, productId },
  })

  return { success: true, data: await buildCartSummary(userId) }
}

/**
 * Removes all items from the current user's cart.
 */
export async function clearCart(): Promise<CartActionResult> {
  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  await db.cartItem.deleteMany({ where: { userId } })

  return { success: true, data: undefined }
}
