'use server'
// ============================================================
// ShopSphere — Auth server actions
//
// registerAction  → create account (default role: CUSTOMER)
// loginAction     → verify credentials + set session cookie
// logoutAction    → destroy session cookie
// ============================================================

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createSession, destroySession } from '@/lib/session'
import { Role } from '@/generated/prisma/enums'

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const LoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── Return types ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Password utilities ───────────────────────────────────────────────────────

/** Hashes a plain-text password using bcrypt (work factor 12). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

/** Compares a plain-text password against a bcrypt hash. */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ─── Register ─────────────────────────────────────────────────────────────────

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterResult = ActionResult<{ userId: string }>

/**
 * Creates a new CUSTOMER account.
 * On success, sets the session cookie.
 * Never throws to the client — always returns ActionResult.
 */
export async function registerAction(
  input: RegisterInput
): Promise<RegisterResult> {
  const parsed = RegisterSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists',
    }
  }

  const passwordHash = await hashPassword(password)

  try {
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: Role.CUSTOMER, // default role — never trust client for this
      },
    })

    await createSession(user.id, user.role)

    return { success: true, data: { userId: user.id } }
  } catch (err) {
    console.error('[registerAction]', err)
    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    }
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export type LoginInput = { email: string; password: string }
export type LoginResult = ActionResult<{ userId: string; role: string }>

/**
 * Verifies credentials and sets the session cookie.
 * On success, returns userId + role so the frontend can redirect appropriately.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >
    return { success: false, error: 'Validation failed', fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    // Generic error — don't reveal whether email exists
    return { success: false, error: 'Invalid email or password' }
  }

  const passwordMatch = await verifyPassword(password, user.passwordHash)
  if (!passwordMatch) {
    return { success: false, error: 'Invalid email or password' }
  }

  await createSession(user.id, user.role)

  return { success: true, data: { userId: user.id, role: user.role } }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Destroys the session cookie and redirects to /login.
 * Must be called from a Server Action (form action or action={logoutAction}).
 */
export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/login')
}
