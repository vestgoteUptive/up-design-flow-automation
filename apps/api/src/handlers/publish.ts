/**
 * Publish Lambda handler
 * Handles publishing components to CodeArtifact and npm
 */

import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/responses'
import { extractToken, verifyToken } from '../utils/jwt'
import { getClient } from '@design-studio/db'
import { getIdeaById, getPromotion } from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

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
 * POST /publish - Publish a component to npm/CodeArtifact
 * TODO: Implement npm publish via CodeArtifact
 */
export async function publishComponentHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = JSON.parse(event.body || '{}')
    const { ideaId, projectId, version, packageName } = body

    if (!ideaId || !projectId) {
      return errorResponse('VALIDATION_ERROR', 'ideaId and projectId are required', 400)
    }

    const client = getClient()

    // Verify idea exists
    const idea = await getIdeaById(client, projectId, ideaId)
    if (!idea) {
      return notFoundResponse('Idea')
    }

    // Verify promotion exists and is in VERIFIED state
    const promotion = await getPromotion(client, ideaId)
    if (!promotion) {
      return errorResponse('NOT_PROMOTED', 'Idea must be promoted first', 400)
    }

    if (promotion.status !== 'VERIFIED') {
      return errorResponse('INVALID_STATUS', 'Promotion must be verified before publishing', 400)
    }

    // TODO: Implement CodeArtifact publish
    // TODO: Generate package.json with version
    // TODO: Create npm tarball
    // TODO: Upload to CodeArtifact

    const mockPublish = {
      packageName: packageName || `@design-studio/${idea.id}`,
      version: version || '1.0.0',
      url: `https://npm.codeartifact.example.com/@design-studio/${idea.id}`,
      publishedAt: new Date().toISOString(),
    }

    return successResponse(mockPublish)
  } catch (error) {
    console.error('Publish component error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to publish component', 500)
  }
}

/**
 * GET /publish/history - Get publish history for a component
 */
export async function publishHistoryHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const { ideaId, projectId } = event.pathParameters || {}
    if (!ideaId || !projectId) {
      return errorResponse('VALIDATION_ERROR', 'Idea ID and Project ID are required', 400)
    }

    const client = getClient()
    const idea = await getIdeaById(client, projectId, ideaId)

    if (!idea) {
      return notFoundResponse('Idea')
    }

    // TODO: Query publish history from DynamoDB (new table or in Promotion record)
    const mockHistory = [
      {
        version: '1.0.0',
        publishedAt: new Date().toISOString(),
        url: 'https://npm.codeartifact.example.com/@design-studio/idea-id@1.0.0',
      },
    ]

    return successResponse({ history: mockHistory })
  } catch (error) {
    console.error('Publish history error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch publish history', 500)
  }
}
