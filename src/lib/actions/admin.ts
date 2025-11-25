'use server'
// ============================================================
// ShopSphere — Admin server actions
//
// ALL functions in this file require requireRole(Role.ADMIN).
// Business logic: stats, revenue charts, product CRUD, order management.
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Role, OrderStatus, PaymentStatus } from '@/generated/prisma/enums'

// ─── Return type helper ───────────────────────────────────────────────────────

export type AdminActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalRevenuePaise: number   // sum of all PAID order totals
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  lowStockCount: number       // products with stock <= 5
  totalProducts: number
  totalCustomers: number
}

export type RevenueDataPoint = {
  date: string          // 'YYYY-MM-DD' — for recharts xAxis
  revenuePaise: number
  orders: number
}

export type OrderStatusBreakdown = {
  status: string
  count: number
}

export type AdminProductItem = {
  id: string
  name: string
  slug: string
  price: number           // paise
  compareAtPrice: number | null
  stock: number
  featured: boolean
  ratingAvg: number
  category: { id: string; name: string; slug: string }
  primaryImage: string | null
  createdAt: Date
}

export type AdminOrderItem = {
  id: string
  status: string
  total: number           // paise
  subtotal: number        // paise
  shippingFee: number     // paise
  createdAt: Date
  shippingName: string
  shippingCity: string
  itemCount: number
  customer: { id: string; name: string; email: string }
  payment: { status: string; provider: string } | null
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 5

const ProductInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().int().positive('Price must be a positive integer (paise)'),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0, 'Stock must be 0 or more'),
  categoryId: z.string().cuid('Invalid category ID'),
  featured: z.boolean().optional().default(false),
  ratingAvg: z.number().min(0).max(5).optional().default(0),
  imageUrls: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image is required')
    .optional(),
})

export type ProductInput = z.input<typeof ProductInputSchema>

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]),
})

// ─── Stats & Dashboard ────────────────────────────────────────────────────────

/**
 * Returns aggregated KPI stats for the admin dashboard.
 */
export async function getAdminStats(): Promise<AdminActionResult<AdminStats>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const [
    revenueAgg,
    totalOrders,
    paidOrders,
    pendingOrders,
    lowStockCount,
    totalProducts,
    totalCustomers,
  ] = await Promise.all([
    // Sum total from PAID orders only
    db.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { total: true },
    }),
    db.order.count(),
    db.order.count({ where: { status: OrderStatus.PAID } }),
    db.order.count({ where: { status: OrderStatus.PENDING } }),
    db.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
    db.product.count(),
    db.user.count({ where: { role: Role.CUSTOMER } }),
  ])

  return {
    success: true,
    data: {
      totalRevenuePaise: revenueAgg._sum.total ?? 0,
      totalOrders,
      paidOrders,
      pendingOrders,
      lowStockCount,
      totalProducts,
      totalCustomers,
    },
  }
}

/**
 * Returns daily revenue + order count for the last `days` days.
 * Used for the recharts revenue chart on the admin dashboard.
 */
export async function getRevenueSeries(
  days = 45
): Promise<AdminActionResult<RevenueDataPoint[]>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const orders = await db.order.findMany({
    where: {
      status: OrderStatus.PAID,
      createdAt: { gte: since },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date string 'YYYY-MM-DD'
  const byDate: Record<string, { revenuePaise: number; orders: number }> = {}

  // Pre-fill all days so the chart has a continuous X axis
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    byDate[key] = { revenuePaise: 0, orders: 0 }
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    if (byDate[key]) {
      byDate[key].revenuePaise += order.total
      byDate[key].orders += 1
    }
  }

  const data: RevenueDataPoint[] = Object.entries(byDate).map(
    ([date, val]) => ({ date, ...val })
  )

  return { success: true, data }
}

/**
 * Returns order counts grouped by status.
 * Used for the donut/bar breakdown chart on the admin dashboard.
 */
export async function getOrdersByStatusBreakdown(): Promise<
  AdminActionResult<OrderStatusBreakdown[]>
> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const groups = await db.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  const data: OrderStatusBreakdown[] = groups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }))

  return { success: true, data }
}

// ─── Product CRUD ─────────────────────────────────────────────────────────────

/**
 * Lists all products for the admin product table (includes stock, category).
 */
export async function adminListProducts(): Promise<
  AdminActionResult<AdminProductItem[]>
> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      featured: true,
      ratingAvg: true,
      createdAt: true,
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: { url: true, position: true },
        orderBy: { position: 'asc' },
        take: 1,
      },
    },
  })

  const data: AdminProductItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    featured: p.featured,
    ratingAvg: p.ratingAvg,
    createdAt: p.createdAt,
    category: p.category,
    primaryImage: p.images[0]?.url ?? null,
  }))

  return { success: true, data }
}

/**
 * Creates a new product with images.
 * Zod-validates all fields; returns fieldErrors on validation failure.
 */
export async function createProduct(
  input: ProductInput
): Promise<AdminActionResult<{ productId: string }>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const parsed = ProductInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const {
    name,
    slug,
    description,
    price,
    compareAtPrice,
    stock,
    categoryId,
    featured,
    ratingAvg,
    imageUrls,
  } = parsed.data

  // Check slug uniqueness
  const existing = await db.product.findUnique({ where: { slug } })
  if (existing) {
    return {
      success: false,
      error: 'A product with this slug already exists',
      fieldErrors: { slug: ['Slug is already taken'] },
    }
  }

  // Check category exists
  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    return {
      success: false,
      error: 'Category not found',
      fieldErrors: { categoryId: ['Invalid category'] },
    }
  }

  try {
    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice: compareAtPrice ?? null,
        stock,
        categoryId,
        featured,
        ratingAvg,
        images: imageUrls
          ? {
              create: imageUrls.map((url, position) => ({ url, position })),
            }
          : undefined,
      },
    })

    return { success: true, data: { productId: product.id } }
  } catch (err) {
    console.error('[createProduct]', err)
    return { success: false, error: 'Failed to create product' }
  }
}

/**
 * Updates an existing product. Partial update — only provided fields are changed.
 * If imageUrls is provided, REPLACES all existing images.
 */
export async function updateProduct(
  productId: string,
  input: Partial<ProductInput>
): Promise<AdminActionResult<{ productId: string }>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const productIdParsed = z.string().cuid().safeParse(productId)
  if (!productIdParsed.success) {
    return { success: false, error: 'Invalid product ID' }
  }

  // Validate only the provided fields
  const parsed = ProductInputSchema.partial().safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const { imageUrls, ...productData } = parsed.data

  // Check product exists
  const existing = await db.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return { success: false, error: 'Product not found' }
  }

  // Check slug uniqueness if slug is being changed
  if (productData.slug && productData.slug !== existing.slug) {
    const slugConflict = await db.product.findUnique({
      where: { slug: productData.slug },
    })
    if (slugConflict) {
      return {
        success: false,
        error: 'Slug is already taken',
        fieldErrors: { slug: ['Slug is already taken'] },
      }
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: productData,
      })

      if (imageUrls !== undefined) {
        // Replace all images
        await tx.productImage.deleteMany({ where: { productId } })
        if (imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: imageUrls.map((url, position) => ({
              productId,
              url,
              position,
            })),
          })
        }
      }
    })

    return { success: true, data: { productId } }
  } catch (err) {
    console.error('[updateProduct]', err)
    return { success: false, error: 'Failed to update product' }
  }
}

/**
 * Deletes a product.
 *
 * IMPORTANT: OrderItem.productId is onDelete:Restrict — if this product
 * appears in any order, Prisma will throw a P2003 FK constraint error.
 * We catch it gracefully and return a user-friendly message instead of crashing.
 */
export async function deleteProduct(
  productId: string
): Promise<AdminActionResult<{ deleted: boolean; message: string }>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const productIdParsed = z.string().cuid().safeParse(productId)
  if (!productIdParsed.success) {
    return { success: false, error: 'Invalid product ID' }
  }

  const existing = await db.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return { success: false, error: 'Product not found' }
  }

  try {
    await db.product.delete({ where: { id: productId } })
    return {
      success: true,
      data: { deleted: true, message: 'Product deleted successfully' },
    }
  } catch (err: unknown) {
    // Prisma FK violation (P2003) — product is referenced by order items
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2003'
    ) {
      return {
        success: true,
        data: {
          deleted: false,
          message:
            'Product has existing orders and cannot be deleted. Set stock to 0 to hide it from the storefront.',
        },
      }
    }

    console.error('[deleteProduct]', err)
    return { success: false, error: 'Failed to delete product' }
  }
}

// ─── Order Management ─────────────────────────────────────────────────────────

/**
 * Lists all orders for the admin, optionally filtered by status.
 * Newest first.
 */
export async function adminListOrders(input?: {
  status?: string
}): Promise<AdminActionResult<AdminOrderItem[]>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  // Validate status filter if provided
  let statusFilter: OrderStatus | undefined
  if (input?.status) {
    const statusParsed = z
      .enum([
        OrderStatus.PENDING,
        OrderStatus.PAID,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ])
      .safeParse(input.status)

    if (!statusParsed.success) {
      return { success: false, error: 'Invalid status filter' }
    }
    statusFilter = statusParsed.data
  }

  const orders = await db.order.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      total: true,
      subtotal: true,
      shippingFee: true,
      createdAt: true,
      shippingName: true,
      shippingCity: true,
      user: { select: { id: true, name: true, email: true } },
      payment: { select: { status: true, provider: true } },
      _count: { select: { items: true } },
    },
  })

  const data: AdminOrderItem[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    createdAt: o.createdAt,
    shippingName: o.shippingName,
    shippingCity: o.shippingCity,
    itemCount: o._count.items,
    customer: o.user,
    payment: o.payment
      ? { status: o.payment.status, provider: o.payment.provider }
      : null,
  }))

  return { success: true, data }
}

/**
 * Updates the status of an order (e.g. PAID → SHIPPED → DELIVERED).
 * Also updates Payment.status if the order is being marked PAID.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<AdminActionResult<{ orderId: string; newStatus: string }>> {
  try {
    await requireRole(Role.ADMIN)
  } catch {
    return { success: false, error: 'Forbidden' }
  }

  const parsed = UpdateOrderStatusSchema.safeParse({ orderId, status })
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: messages }
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, payment: { select: { id: true } } },
  })

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  try {
    const ops: Parameters<typeof db.$transaction>[0] extends Array<infer Op>
      ? Op[]
      : never[] = []

    const updateOrder = db.order.update({
      where: { id: orderId },
      data: { status: parsed.data.status },
    })

    // If admin manually marks as PAID and there's an associated payment, sync it
    const updatePayment =
      parsed.data.status === OrderStatus.PAID && order.payment
        ? db.payment.update({
            where: { orderId },
            data: { status: PaymentStatus.PAID },
          })
        : null

    if (updatePayment) {
      await db.$transaction([updateOrder, updatePayment])
    } else {
      await updateOrder
    }

    return {
      success: true,
      data: { orderId, newStatus: parsed.data.status },
    }
  } catch (err) {
    console.error('[updateOrderStatus]', err)
    return { success: false, error: 'Failed to update order status' }
  }
}
