/**
 * Ideas Lambda handler
 * Handles creation, iteration, and status updates for design ideas
 */

import { v4 as uuid } from 'uuid'
import { getClient } from '@design-studio/db'
import {
  getIdeaById,
  getIdeasByProject,
  createIdea,
  updateIdea,
  deleteIdea,
  getProjectById,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { Idea, IdeaStatus } from '@design-studio/types'
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
 * POST /projects/{projectId}/ideas - Create a new idea
 */
export async function createIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const projectId = event.pathParameters?.projectId
    if (!projectId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)
    }

    const body = JSON.parse(event.body || '{}')
    const { sourceType, sourceData, userPrompt } = body

    if (!sourceType || !sourceData) {
      return errorResponse('VALIDATION_ERROR', 'sourceType and sourceData are required', 400)
    }

    if (!['FIGMA', 'URL', 'PROMPT'].includes(sourceType)) {
      return errorResponse('VALIDATION_ERROR', 'sourceType must be FIGMA, URL, or PROMPT', 400)
    }

    const client = getClient()

    // Verify project exists and user is a member
    const project = await getProjectById(client, projectId)
    if (!project) {
      return notFoundResponse('Project')
    }

    const ideaId = uuid()
    const idea: Idea = {
      id: ideaId,
      projectId,
      createdById: user.userId,
      createdByName: user.name,
      sourceType: sourceType as 'FIGMA' | 'URL' | 'PROMPT',
      sourceData,
      userPrompt,
      status: 'DRAFT' as IdeaStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await createIdea(client, idea)

    return successResponse(idea, 201)
  } catch (error) {
    console.error('Create idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create idea', 500)
  }
}

/**
 * GET /projects/{projectId}/ideas/{ideaId} - Get a specific idea
 */
export async function getIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const { projectId, ideaId } = event.pathParameters || {}
    if (!projectId || !ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and Idea ID are required', 400)
    }

    const client = getClient()
    const idea = await getIdeaById(client, projectId, ideaId)

    if (!idea) {
      return notFoundResponse('Idea')
    }

    return successResponse(idea)
  } catch (error) {
    console.error('Get idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch idea', 500)
  }
}

/**
 * GET /projects/{projectId}/ideas - List all ideas in a project
 */
export async function listIdeasHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const projectId = event.pathParameters?.projectId
    if (!projectId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)
    }

    const client = getClient()
    const ideas = await getIdeasByProject(client, projectId)

    return successResponse({ ideas })
  } catch (error) {
    console.error('List ideas error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list ideas', 500)
  }
}

/**
 * PUT /projects/{projectId}/ideas/{ideaId} - Update an idea (status, prompt, etc)
 */
export async function updateIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const { projectId, ideaId } = event.pathParameters || {}
    if (!projectId || !ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and Idea ID are required', 400)
    }

    const client = getClient()
    const idea = await getIdeaById(client, projectId, ideaId)

    if (!idea) {
      return notFoundResponse('Idea')
    }

    const body = JSON.parse(event.body || '{}')
    const updates = {
      status: body.status,
      userPrompt: body.userPrompt,
      sourceData: body.sourceData,
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    )

    if (Object.keys(filteredUpdates).length > 0) {
      filteredUpdates.updatedAt = new Date().toISOString()
      await updateIdea(client, projectId, ideaId, filteredUpdates)
    }

    return successResponse({ ...idea, ...filteredUpdates })
  } catch (error) {
    console.error('Update idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update idea', 500)
  }
}

/**
 * DELETE /projects/{projectId}/ideas/{ideaId} - Delete an idea
 */
export async function deleteIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const { projectId, ideaId } = event.pathParameters || {}
    if (!projectId || !ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and Idea ID are required', 400)
    }

    const client = getClient()
    const idea = await getIdeaById(client, projectId, ideaId)

    if (!idea) {
      return notFoundResponse('Idea')
    }

    // Only creator can delete
    if (idea.createdById !== user.userId) {
      return errorResponse('FORBIDDEN', 'You do not own this idea', 403)
    }

    await deleteIdea(client, projectId, ideaId)

    return successResponse({ message: 'Idea deleted' })
  } catch (error) {
    console.error('Delete idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete idea', 500)
  }
}
