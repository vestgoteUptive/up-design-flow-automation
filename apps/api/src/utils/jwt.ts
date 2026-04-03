/**
 * JWT utilities for authentication
 * Signs, verifies, and decodes tokens
 */

import jwt, { SignOptions } from 'jsonwebtoken'
import type { SessionData } from '@design-studio/types'

const secret: string = process.env.JWT_SECRET || ''
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required')
}

/**
 * Sign a JWT token
 */
export function signToken(data: SessionData): string {
  const expiresIn = (process.env.JWT_EXPIRY || '7d') as string
  return jwt.sign(data, secret, { expiresIn } as SignOptions)
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionData | null {
  try {
    const payload = jwt.verify(token, secret)
    if (typeof payload !== 'object' || payload === null) {
      return null
    }
    return payload as SessionData
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}
