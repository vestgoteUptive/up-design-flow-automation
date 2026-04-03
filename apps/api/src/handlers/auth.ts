/**
 * Auth Lambda handler
 * Handles POST /auth/register, POST /auth/login, GET /auth/session
 */

import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { getClient } from '@design-studio/db'
import {
  getUserByEmail,
  createUser,
  getUserById,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/responses'
import { signToken, verifyToken, extractToken } from '../utils/jwt'

/**
 * POST /auth/register - Create a new user account
 */
export async function registerHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { email, name, password } = body

    if (!email || !name || !password) {
      return errorResponse('VALIDATION_ERROR', 'Missing required fields: email, name, password', 400)
    }

    if (password.length < 8) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters', 400)
    }

    const client = getClient()

    // Check if user already exists
    const existing = await getUserByEmail(client, email)
    if (existing) {
      return errorResponse('USER_EXISTS', 'User with this email already exists', 409)
    }

    // Create new user
    const userId = uuid()
    const passwordHash = await bcrypt.hash(password, 10)
    const user = {
      id: userId,
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    await createUser(client, user)

    // Return auth tokens
    const sessionData = {
      userId,
      email,
      name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    return successResponse(
      {
        accessToken: signToken(sessionData),
        user: { id: userId, email, name },
      },
      201,
    )
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to register user', 500)
  }
}

/**
 * POST /auth/login - Authenticate and get tokens
 */
export async function loginHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('VALIDATION_ERROR', 'Missing required fields: email, password', 400)
    }

    const client = getClient()

    // Find user by email
    const user = await getUserByEmail(client, email)
    if (!user) {
      return errorResponse('AUTH_FAILED', 'Invalid email or password', 401)
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return errorResponse('AUTH_FAILED', 'Invalid email or password', 401)
    }

    // Create session
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    return successResponse({
      accessToken: signToken(sessionData),
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to authenticate', 500)
  }
}

/**
 * GET /auth/session - Verify and return current session
 */
export async function sessionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = extractToken(event.headers.Authorization)
    if (!token) {
      return unauthorizedResponse()
    }

    const session = verifyToken(token)
    if (!session) {
      return unauthorizedResponse()
    }

    const client = getClient()

    // Verify user still exists
    const user = await getUserById(client, session.userId)
    if (!user) {
      return unauthorizedResponse()
    }

    return successResponse({
      session: {
        userId: user.id,
        email: user.email,
        name: user.name,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to verify session', 500)
  }
}
