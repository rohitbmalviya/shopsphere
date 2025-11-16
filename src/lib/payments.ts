// ============================================================
// ShopSphere — Payment provider seam
//
// This is the ONLY place that talks to a payment gateway.
// Currently: mock implementation (always succeeds after ~100 ms).
//
// Two supported providers:
//   'mock-stripe'   — simulates Stripe PaymentIntents flow
//   'mock-razorpay' — simulates Razorpay Orders flow
//
// TODO: Replace mockProcessPayment with real gateway calls.
//       Stripe:   stripe.paymentIntents.create(...)
//       Razorpay: razorpay.orders.create(...)
//       Keep the same function signature so callers don't change.
// ============================================================

export type PaymentProvider = 'mock-stripe' | 'mock-razorpay'

export type PaymentResult =
  | { success: true; transactionId: string }
  | { success: false; error: string }

/**
 * Mock payment processor — simulates both Stripe and Razorpay flows.
 * Always returns success in development. Simulates 80-180 ms network latency.
 *
 * Replace this body with real gateway integration when going to production.
 */
export async function mockProcessPayment(params: {
  orderId: string
  amountPaise: number
  provider: PaymentProvider
  currency?: string
}): Promise<PaymentResult> {
  // Simulate network latency (80-180 ms)
  await new Promise((resolve) =>
    setTimeout(resolve, 80 + Math.floor(Math.random() * 100))
  )

  const prefix = params.provider === 'mock-razorpay' ? 'rzp' : 'pi'
  const transactionId = `${prefix}_mock_${params.orderId}_${Date.now()}`

  return { success: true, transactionId }
}

/**
 * Formats paise as a human-readable rupee string.
 * e.g. 150000 → "₹1,500"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
}
