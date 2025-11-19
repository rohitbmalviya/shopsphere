'use server'
// ============================================================
// ShopSphere — Order / Checkout server actions
//
// placeOrder   → full checkout transaction:
//                re-check stock → create Order+Items+Payment
//                → mock pay → update statuses → decrement stock
//                → clear cart. All in a single $transaction.
//
// getMyOrders  → customer's order history
// getOrderById → single order (ownership-checked)
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { mockProcessPayment } from '@/lib/payments'
import type { PaymentProvider } from '@/lib/payments'
import { OrderStatus, PaymentStatus } from '@/generated/prisma/enums'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type OrderListItem = {
  id: string
  status: string
  total: number       // paise
  subtotal: number    // paise
  shippingFee: number // paise
  createdAt: Date
  itemCount: number
  payment: {
    status: string
    provider: string
  } | null
}

export type OrderItemDetail = {
  id: string
  name: string        // snapshot
  unitPrice: number   // paise snapshot
  quantity: number
  lineTotal: number   // paise
}

export type OrderDetail = {
  id: string
  status: string
  subtotal: number
  shippingFee: number
  total: number
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingPincode: string
  createdAt: Date
  items: OrderItemDetail[]
  payment: {
    id: string
    status: string
    provider: string
    amount: number
    createdAt: Date
  } | null
}

// ─── Validation ───────────────────────────────────────────────────────────────

const PlaceOrderSchema = z.object({
  shippingName: z.string().min(2, 'Name is required'),
  shippingAddress: z.string().min(5, 'Address is required'),
  shippingCity: z.string().min(2, 'City is required'),
  shippingPincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  provider: z.enum(['mock-stripe', 'mock-razorpay']),
})

export type PlaceOrderInput = z.input<typeof PlaceOrderSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

/** Flat shipping fee in paise (₹49) for orders under ₹500, else free. */
const SHIPPING_THRESHOLD_PAISE = 50_000  // ₹500
const SHIPPING_FEE_PAISE       = 4_900   // ₹49

// ─── placeOrder ───────────────────────────────────────────────────────────────

/**
 * Full checkout transaction:
 * 1. Validate input + auth
 * 2. Load cart items
 * 3. Inside a Prisma $transaction:
 *    a. Re-check stock for every line (fail cleanly if insufficient)
 *    b. Create Order (PENDING) + OrderItems (with name/unitPrice snapshots)
 *    c. Create Payment (PENDING)
 *    d. Run mockProcessPayment
 *    e. On success: update Order → PAID, Payment → PAID
 *    f. Decrement stock atomically (never oversell)
 *    g. Delete user's CartItems
 * 4. Return { orderId }
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<OrderActionResult<{ orderId: string }>> {
  // Auth
  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'You must be logged in to place an order' }
  }

  // Validate input
  const parsed = PlaceOrderSchema.safeParse(input)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(', ')
    return { success: false, error: messages }
  }

  const {
    shippingName,
    shippingAddress,
    shippingCity,
    shippingPincode,
    provider,
  } = parsed.data

  // Load cart (outside transaction — read-only)
  const cartItems = await db.cartItem.findMany({
    where: { userId },
    select: {
      productId: true,
      quantity: true,
      product: {
        select: { id: true, name: true, price: true, stock: true },
      },
    },
  })

  if (cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty' }
  }

  // Compute totals (outside tx for clarity; will be re-verified inside)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const shippingFee =
    subtotal >= SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_FEE_PAISE
  const total = subtotal + shippingFee

  // Run everything in a single transaction
  try {
    const result = await db.$transaction(async (tx) => {
      // 3a — Re-check stock for each cart item inside the transaction
      for (const item of cartItems) {
        const fresh = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        })

        if (!fresh) {
          throw new Error(`Product "${item.product.name}" is no longer available`)
        }

        if (fresh.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.product.name}": ` +
              `${fresh.stock} available, ${item.quantity} requested`
          )
        }
      }

      // 3b — Create the Order
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          subtotal,
          shippingFee,
          total,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingPincode,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,        // snapshot
              unitPrice: item.product.price,  // snapshot
              quantity: item.quantity,
            })),
          },
        },
      })

      // 3c — Create Payment (PENDING)
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          status: PaymentStatus.PENDING,
          provider: provider as string,
        },
      })

      return { orderId: order.id }
    })

    // 3d — Run mock payment OUTSIDE the transaction (simulates async gateway call)
    const payResult = await mockProcessPayment({
      orderId: result.orderId,
      amountPaise: total,
      provider: provider as PaymentProvider,
    })

    if (!payResult.success) {
      // Payment failed — mark order + payment as FAILED
      await db.$transaction([
        db.order.update({
          where: { id: result.orderId },
          data: { status: OrderStatus.CANCELLED },
        }),
        db.payment.update({
          where: { orderId: result.orderId },
          data: { status: PaymentStatus.FAILED },
        }),
      ])
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    // 3e+3f+3g — Payment succeeded: update Order→PAID, Payment→PAID,
    //             decrement stock atomically, clear cart
    await db.$transaction([
      db.order.update({
        where: { id: result.orderId },
        data: { status: OrderStatus.PAID },
      }),
      db.payment.update({
        where: { orderId: result.orderId },
        data: { status: PaymentStatus.PAID },
      }),
      ...cartItems.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      ),
      db.cartItem.deleteMany({ where: { userId } }),
    ])

    return { success: true, data: { orderId: result.orderId } }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Order failed. Please try again.'
    console.error('[placeOrder]', err)
    return { success: false, error: message }
  }
}

// ─── getMyOrders ──────────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's order history, newest first.
 */
export async function getMyOrders(): Promise<
  OrderActionResult<OrderListItem[]>
> {
  let userId: string
  try {
    const user = await requireUser()
    userId = user.id
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      total: true,
      subtotal: true,
      shippingFee: true,
      createdAt: true,
      payment: { select: { status: true, provider: true } },
      _count: { select: { items: true } },
    },
  })

  const data: OrderListItem[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    createdAt: o.createdAt,
    itemCount: o._count.items,
    payment: o.payment
      ? { status: o.payment.status, provider: o.payment.provider }
      : null,
  }))

  return { success: true, data }
}

// ─── getOrderById ─────────────────────────────────────────────────────────────

/**
 * Returns the full detail of a single order.
 * Enforces ownership: customers can only see their own orders.
 * Admins can view any order.
 */
export async function getOrderById(
  orderId: string
): Promise<OrderActionResult<OrderDetail>> {
  const orderIdParsed = z.string().cuid().safeParse(orderId)
  if (!orderIdParsed.success) {
    return { success: false, error: 'Invalid order ID' }
  }

  let userId: string
  let role: string
  try {
    const user = await requireUser()
    userId = user.id
    role = user.role
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      subtotal: true,
      shippingFee: true,
      total: true,
      shippingName: true,
      shippingAddress: true,
      shippingCity: true,
      shippingPincode: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          name: true,
          unitPrice: true,
          quantity: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  })

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  // Ownership check — admins can see any order; customers only their own
  if (role !== 'ADMIN' && order.userId !== userId) {
    return { success: false, error: 'Order not found' }
  }

  const data: OrderDetail = {
    id: order.id,
    status: order.status,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPincode: order.shippingPincode,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          status: order.payment.status,
          provider: order.payment.provider,
          amount: order.payment.amount,
          createdAt: order.payment.createdAt,
        }
      : null,
  }

  return { success: true, data }
}
