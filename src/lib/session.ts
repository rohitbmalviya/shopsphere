// ============================================================
// ShopSphere — Session management (jose JWT + httpOnly cookie)
//
// Cookie name : "ss_session"
// Algorithm   : HS256 (AUTH_SECRET as symmetric key)
// Lifetime    : 7 days, sliding-window refresh on each visit
// ============================================================

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import type { Role } from '@/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const COOKIE_NAME = 'ss_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getEncodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET env var is missing or shorter than 32 chars')
  }
  return new TextEncoder().encode(secret)
}

// ─── Payload types ───────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string
  role: Role
  expiresAt: number // Unix timestamp ms
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

// ─── JWT encrypt / decrypt ───────────────────────────────────────────────────

async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt / 1000)) // seconds
    .sign(getEncodedSecret())
}

async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Called after successful login/register — writes the session cookie. */
export async function createSession(userId: string, role: Role): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const token = await encryptSession({ userId, role, expiresAt })
  const store = await cookies()
  store.set(COOKIE_NAME, token, cookieOptions(new Date(expiresAt)))
}

/**
 * Reads + verifies the session cookie.
 * Returns null when there is no valid session (not logged in / expired / tampered).
 * Safe to call from Server Components; does NOT make a DB round-trip.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return decryptSession(token)
}

/**
 * Fully resolves the current user from the DB.
 * Returns null if unauthenticated. Intended for Server Components.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  })

  return user ?? null
}

/** Destroys the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Throws an error when the user is not authenticated.
 * Use inside Server Actions / Server Components that require auth.
 * Returns the session user so callers can use it without a second call.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHENTICATED')
  }
  return user
}

/**
 * Like requireUser() but also enforces a specific role.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== role) {
    throw new Error('FORBIDDEN')
  }
  return user
}
