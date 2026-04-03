/**
 * Projects Lambda handler
 * Handles CRUD operations for projects and Figma connections
 */

import { v4 as uuid } from 'uuid'
import { getClient } from '@design-studio/db'
import {
  getProjectById,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { Project } from '@design-studio/types'
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
 * POST /projects - Create a new project
 */
export async function createProjectHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = JSON.parse(event.body || '{}')
    const { name, description, agentInstructions, githubRepoUrl, githubBranch } = body

    if (!name) {
      return errorResponse('VALIDATION_ERROR', 'Project name is required', 400)
    }

    const projectId = uuid()
    const project: Project = {
      id: projectId,
      name,
      description,
      creatorId: user.userId,
      agentInstructions,
      githubRepoUrl,
      githubBranch: githubBranch || 'main',
      createdAt: new Date().toISOString(),
    }

    const client = getClient()
    await createProject(client, project)

    return successResponse(project, 201)
  } catch (error) {
    console.error('Create project error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create project', 500)
  }
}

/**
 * GET /projects/{projectId} - Get a specific project
 */
export async function getProjectHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const project = await getProjectById(client, projectId)

    if (!project) {
      return notFoundResponse('Project')
    }

    return successResponse(project)
  } catch (error) {
    console.error('Get project error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch project', 500)
  }
}

/**
 * GET /projects - List user's projects
 */
export async function listProjectsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const client = getClient()
    const projects = await getProjects(client, user.userId)

    return successResponse({ projects })
  } catch (error) {
    console.error('List projects error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list projects', 500)
  }
}

/**
 * PUT /projects/{projectId} - Update a project
 */
export async function updateProjectHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const project = await getProjectById(client, projectId)

    if (!project) {
      return notFoundResponse('Project')
    }

    if (project.creatorId !== user.userId) {
      return errorResponse('FORBIDDEN', 'You do not own this project', 403)
    }

    const body = JSON.parse(event.body || '{}')
    const updates = {
      name: body.name,
      description: body.description,
      agentInstructions: body.agentInstructions,
      githubRepoUrl: body.githubRepoUrl,
      githubBranch: body.githubBranch,
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    )

    await updateProject(client, projectId, filteredUpdates)

    return successResponse({ ...project, ...filteredUpdates })
  } catch (error) {
    console.error('Update project error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update project', 500)
  }
}

/**
 * DELETE /projects/{projectId} - Delete a project
 */
export async function deleteProjectHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const project = await getProjectById(client, projectId)

    if (!project) {
      return notFoundResponse('Project')
    }

    if (project.creatorId !== user.userId) {
      return errorResponse('FORBIDDEN', 'You do not own this project', 403)
    }

    await deleteProject(client, projectId)

    return successResponse({ message: 'Project deleted' })
  } catch (error) {
    console.error('Delete project error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete project', 500)
  }
}
