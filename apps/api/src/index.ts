/**
 * Lambda handler router
 * Dispatches API Gateway events to appropriate handlers based on path and method
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { errorResponse } from './utils/responses'

// Import all handlers
import {
  registerHandler,
  loginHandler,
  sessionHandler,
} from './handlers/auth'
import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from './handlers/projects'
import {
  createIdeaHandler,
  getIdeaHandler,
  listIdeasHandler,
  updateIdeaHandler,
  deleteIdeaHandler,
} from './handlers/ideas'
import {
  promoteIdeaHandler,
  getPromotionHandler,
  listPromotionsHandler,
  updatePromotionHandler,
} from './handlers/gallery'
import {
  iterateIdeaHandler,
  importDesignHandler,
} from './handlers/bedrock'
import {
  createPRHandler,
  webhookHandler,
  oauthCallbackHandler,
} from './handlers/github'
import {
  publishComponentHandler,
  publishHistoryHandler,
} from './handlers/publish'

/**
 * Main Lambda handler
 * Routes requests to appropriate handlers
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { path, httpMethod } = event

  // Auth routes
  if (path === '/auth/register' && httpMethod === 'POST') return registerHandler(event)
  if (path === '/auth/login' && httpMethod === 'POST') return loginHandler(event)
  if (path === '/auth/session' && httpMethod === 'GET') return sessionHandler(event)

  // Project routes
  if (path === '/projects' && httpMethod === 'POST') return createProjectHandler(event)
  if (path === '/projects' && httpMethod === 'GET') return listProjectsHandler(event)
  if (path.match(/^\/projects\/[^/]+$/) && httpMethod === 'GET') return getProjectHandler(event)
  if (path.match(/^\/projects\/[^/]+$/) && httpMethod === 'PUT') return updateProjectHandler(event)
  if (path.match(/^\/projects\/[^/]+$/) && httpMethod === 'DELETE') return deleteProjectHandler(event)

  // Idea routes
  if (path.match(/^\/projects\/[^/]+\/ideas$/) && httpMethod === 'POST') return createIdeaHandler(event)
  if (path.match(/^\/projects\/[^/]+\/ideas$/) && httpMethod === 'GET') return listIdeasHandler(event)
  if (path.match(/^\/projects\/[^/]+\/ideas\/[^/]+$/) && httpMethod === 'GET') return getIdeaHandler(event)
  if (path.match(/^\/projects\/[^/]+\/ideas\/[^/]+$/) && httpMethod === 'PUT') return updateIdeaHandler(event)
  if (path.match(/^\/projects\/[^/]+\/ideas\/[^/]+$/) && httpMethod === 'DELETE') return deleteIdeaHandler(event)

  // Gallery/Promotion routes
  if (path.match(/^\/ideas\/[^/]+\/promote$/) && httpMethod === 'POST') return promoteIdeaHandler(event)
  if (path.match(/^\/ideas\/[^/]+\/promotion$/) && httpMethod === 'GET') return getPromotionHandler(event)
  if (path === '/promotions' && httpMethod === 'GET') return listPromotionsHandler(event)
  if (path.match(/^\/ideas\/[^/]+\/promotion$/) && httpMethod === 'PATCH') return updatePromotionHandler(event)

  // Bedrock agent routes
  if (path.match(/^\/projects\/[^/]+\/ideas\/[^/]+\/iterate$/) && httpMethod === 'POST') return iterateIdeaHandler(event)
  if (path === '/bedrock/import' && httpMethod === 'POST') return importDesignHandler(event)

  // GitHub routes
  if (path === '/github/pr' && httpMethod === 'POST') return createPRHandler(event)
  if (path === '/github/webhook' && httpMethod === 'POST') return webhookHandler(event)
  if (path === '/github/oauth/callback' && httpMethod === 'GET') return oauthCallbackHandler(event)

  // Publish routes
  if (path === '/publish' && httpMethod === 'POST') return publishComponentHandler(event)
  if (path.match(/^\/ideas\/[^/]+\/publish\/history$/) && httpMethod === 'GET') return publishHistoryHandler(event)

  // Health check
  if (path === '/health' && httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
    }
  }

  // 404
  return errorResponse('NOT_FOUND', 'Endpoint not found', 404)
}

export default handler
