/**
 * Gallery Lambda handler
 * Handles promotion of ideas to production (PR creation, publish)
 */

import { v4 as uuid } from 'uuid'
import { getClient } from '@design-studio/db'
import {
  getIdeaById,
  getPromotion,
  createPromotion,
  updatePromotion,
  getPromotions,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { Promotion, PromotionStatus } from '@design-studio/types'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/responses'
import { extractToken, verifyToken } from '../utils/jwt'

/**
 * Get current user from request context
 */
async function getCurrentUser(event: APIGatewayProxyEvent) {
  const token = extractToken(event.headers.Authorization)
  if (!token) {
    return null
  }
  return verifyToken(token)
}

/**
 * POST /ideas/{ideaId}/promote - Promote an idea to production
 * Creates a PR and initializes promotion tracking
 */
export async function promoteIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const ideaId = event.pathParameters?.ideaId
    if (!ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Idea ID is required', 400)
    }

    const body = JSON.parse(event.body || '{}')
    const { projectId } = body

    if (!projectId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)
    }

    const client = getClient()
    const idea = await getIdeaById(client, projectId, ideaId)

    if (!idea) {
      return notFoundResponse('Idea')
    }

    // Check if already promoted
    const existing = await getPromotion(client, ideaId)
    if (existing) {
      return errorResponse('ALREADY_PROMOTED', 'This idea is already in promotion', 409)
    }

    // Create promotion record
    const promotionId = uuid()
    const promotion: Promotion = {
      id: promotionId,
      ideaId,
      promotedById: user.userId,
      promotedByName: user.name,
      status: 'BUILDING' as PromotionStatus,
      createdAt: new Date().toISOString(),
    }

    await createPromotion(client, promotion)

    return successResponse(promotion, 201)
  } catch (error) {
    console.error('Promote idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to promote idea', 500)
  }
}

/**
 * GET /ideas/{ideaId}/promotion - Get promotion status
 */
export async function getPromotionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const ideaId = event.pathParameters?.ideaId
    if (!ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Idea ID is required', 400)
    }

    const client = getClient()
    const promotion = await getPromotion(client, ideaId)

    if (!promotion) {
      return notFoundResponse('Promotion')
    }

    return successResponse(promotion)
  } catch (error) {
    console.error('Get promotion error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch promotion', 500)
  }
}

/**
 * GET /promotions - List all promotions (with optional status filter)
 */
export async function listPromotionsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const client = getClient()
    const status = event.queryStringParameters?.status as PromotionStatus | undefined
    const promotions = await getPromotions(client, status)

    return successResponse({ promotions })
  } catch (error) {
    console.error('List promotions error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list promotions', 500)
  }
}

/**
 * PATCH /ideas/{ideaId}/promotion - Update promotion status
 * Called by Bedrock agent or GitHub webhook to update PR/publish status
 */
export async function updatePromotionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const ideaId = event.pathParameters?.ideaId
    if (!ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Idea ID is required', 400)
    }

    const body = JSON.parse(event.body || '{}')
    const { status, prUrl, prNumber, publishedAt } = body

    if (!status) {
      return errorResponse('VALIDATION_ERROR', 'Status is required', 400)
    }

    if (!['BUILDING', 'PR_OPEN', 'VERIFIED', 'PUBLISHED', 'FAILED'].includes(status)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid promotion status', 400)
    }

    const client = getClient()
    const promotion = await getPromotion(client, ideaId)

    if (!promotion) {
      return notFoundResponse('Promotion')
    }

    const updates = {
      status,
      prUrl,
      prNumber,
      publishedAt,
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    )

    await updatePromotion(client, ideaId, filteredUpdates)

    return successResponse({ ...promotion, ...filteredUpdates })
  } catch (error) {
    console.error('Update promotion error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update promotion', 500)
  }
}
