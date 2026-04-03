/**
 * GitHub Lambda handler
 * Handles PR creation and GitHub App webhook events
 */

import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/responses'
import { extractToken, verifyToken } from '../utils/jwt'
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
 * POST /github/pr - Create a pull request for a promoted component
 * TODO: Implement GitHub API integration
 */
export async function createPRHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = JSON.parse(event.body || '{}')
    const { ideaId, projectId, branch } = body

    if (!ideaId || !projectId || !branch) {
      return errorResponse('VALIDATION_ERROR', 'ideaId, projectId, and branch are required', 400)
    }

    // TODO: Implement GitHub App OAuth flow
    // TODO: Create PR with generated component code
    // For now, return mock response
    const mockPR = {
      number: 123,
      url: 'https://github.com/user/repo/pull/123',
      state: 'open',
      createdAt: new Date().toISOString(),
    }

    return successResponse(mockPR, 201)
  } catch (error) {
    console.error('Create PR error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create pull request', 500)
  }
}

/**
 * POST /github/webhook - Handle GitHub App webhook events
 * Triggered when PR is merged, closed, etc.
 */
export async function webhookHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // TODO: Verify webhook signature using GITHUB_APP_WEBHOOK_SECRET
    const body = JSON.parse(event.body || '{}')
    const action = body.action
    const pr = body.pull_request

    if (!pr) {
      return successResponse({ processed: false })
    }

    // TODO: Update promotion status based on PR state
    // - merged → update status to PUBLISHED
    // - closed → update status to FAILED
    // - approved → update status to VERIFIED

    return successResponse({ processed: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to process webhook', 500)
  }
}

/**
 * GET /github/oauth/callback - OAuth callback handler
 * TODO: Implement GitHub OAuth flow
 */
export async function oauthCallbackHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const code = event.queryStringParameters?.code
    if (!code) {
      return errorResponse('VALIDATION_ERROR', 'OAuth code is required', 400)
    }

    // TODO: Exchange code for token
    // TODO: Store token in Secrets Manager
    // TODO: Link to user/project

    return successResponse({ connected: true })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to complete OAuth', 500)
  }
}
