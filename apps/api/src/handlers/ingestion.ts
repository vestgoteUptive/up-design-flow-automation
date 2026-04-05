/**
 * Ingestion Lambda handler
 * Handles design ingestion results, component selection, and tracking
 */

import { v4 as uuid } from 'uuid'
import { getClient } from '@design-studio/db'
import {
  IngestedComponentsRepository,
  ComponentGenerationRepository,
  DesignTokensRepository,
  ComponentTokensRepository,
  IngestionSessionsRepository,
  getProjectById,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type {
  IngestedComponent,
  ComponentGeneration,
  IngestionSession,
  DesignToken,
  VersionHistoryEntry,
} from '@design-studio/types'
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
 * GET /projects/{projectId}/ingestion
 * List all ingested components from the latest or specified ingestion session
 */
export async function getIngestionResultsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const ingestedRepo = new IngestedComponentsRepository(client)

    // Get ingestion session ID from query params (or use latest)
    const sessionId = event.queryStringParameters?.sessionId

    let components: IngestedComponent[]
    if (sessionId) {
      components = await ingestedRepo.listByIngestion(projectId, sessionId)
    } else {
      components = await ingestedRepo.listByProject(projectId)
    }

    return successResponse({
      components,
      count: components.length,
    })
  } catch (error) {
    console.error('Error fetching ingestion results:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch ingestion results', 500)
  }
}

/**
 * GET /projects/{projectId}/ingestion/{componentId}
 * Get details of a single ingested component
 */
export async function getIngestionComponentHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const projectId = event.pathParameters?.projectId
    const componentId = event.pathParameters?.componentId
    if (!projectId || !componentId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and component ID are required', 400)
    }

    const client = getClient()

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const ingestedRepo = new IngestedComponentsRepository(client)
    const component = await ingestedRepo.getById(projectId, componentId)

    if (!component) {
      return notFoundResponse('Component not found')
    }

    return successResponse(component)
  } catch (error) {
    console.error('Error fetching ingestion component:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch component', 500)
  }
}

/**
 * POST /projects/{projectId}/ingestion/select
 * Mark components for generation (bulk update status to SELECTED)
 */
export async function selectComponentsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const body = JSON.parse(event.body || '{}')
    const { componentIds } = body

    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Component IDs array is required', 400)
    }

    const ingestedRepo = new IngestedComponentsRepository(client)

    // Update all selected components to SELECTED status
    await ingestedRepo.bulkUpdateStatus(projectId, componentIds, 'SELECTED')

    return successResponse({
      message: 'Components marked for generation',
      selectedCount: componentIds.length,
    })
  } catch (error) {
    console.error('Error selecting components:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to select components', 500)
  }
}

/**
 * POST /projects/{projectId}/ingestion/session
 * Start a new ingestion session
 */
export async function startIngestionSessionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const body = JSON.parse(event.body || '{}')
    const { sourceType, sourceData } = body

    if (!sourceType || !sourceData) {
      return errorResponse('VALIDATION_ERROR', 'sourceType and sourceData are required', 400)
    }

    const sessionRepo = new IngestionSessionsRepository(client)

    const session: IngestionSession = {
      id: uuid(),
      projectId,
      createdById: user.userId,
      sourceType,
      sourceData,
      totalComponentsFound: 0,
      selectedForGeneration: 0,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    }

    await sessionRepo.create(session)

    return successResponse(session, 201)
  } catch (error) {
    console.error('Error starting ingestion session:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to start ingestion session', 500)
  }
}

/**
 * POST /projects/{projectId}/components/{componentId}/regenerate
 * Regenerate a component (version increment, new generation record)
 */
export async function regenerateComponentHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const projectId = event.pathParameters?.projectId
    const componentId = event.pathParameters?.componentId
    if (!projectId || !componentId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and component ID are required', 400)
    }

    const client = getClient()

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    // Get ingested component
    const ingestedComponent = await ingestedRepo.getById(projectId, componentId)
    if (!ingestedComponent) {
      return notFoundResponse('Component not found')
    }

    // Get latest generation
    const latestGen = await genRepo.getLatestVersion(componentId)
    if (!latestGen) {
      return errorResponse('GENERATION_ERROR', 'No generation found for component', 400)
    }

    // TODO: Call Bedrock to regenerate component code
    // For now, return placeholder response
    const newVersion = latestGen.version + 1
    const newGeneration: ComponentGeneration = {
      ...latestGen,
      version: newVersion,
      generatedAt: new Date().toISOString(),
      status: 'REGENERATING',
      versionHistory: [
        ...latestGen.versionHistory,
        {
          version: newVersion,
          generatedAt: new Date().toISOString(),
          notes: 'Regenerated after source update',
        } as VersionHistoryEntry,
      ],
    }

    await genRepo.create(newGeneration)
    await ingestedRepo.updateStatus(projectId, componentId, 'REGENERATING')

    return successResponse({
      message: 'Regeneration started',
      newVersion,
      generationId: newGeneration.id,
    })
  } catch (error) {
    console.error('Error regenerating component:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to regenerate component', 500)
  }
}

/**
 * GET /projects/{projectId}/components
 * List all generated components with status and version info
 */
export async function listComponentsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const ingestedRepo = new IngestedComponentsRepository(client)

    // Get all ingested components (they have generation status)
    const components = await ingestedRepo.listByProject(projectId)

    // For each, fetch latest generation
    const genRepo = new ComponentGenerationRepository(client)
    const componentsWithGen = await Promise.all(
      components.map(async (comp) => {
        const latestGen = await genRepo.getLatestVersion(comp.id)
        return {
          ...comp,
          latestGeneration: latestGen,
        }
      })
    )

    return successResponse({
      components: componentsWithGen,
      count: componentsWithGen.length,
    })
  } catch (error) {
    console.error('Error listing components:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list components', 500)
  }
}

/**
 * GET /projects/{projectId}/components/needs-update
 * Get components that have outdated versions (source changed)
 */
export async function getComponentsNeedingUpdateHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    // Get all components with NEEDS_UPDATE status
    const allComponents = await ingestedRepo.listByProject(projectId)
    const needsUpdate = allComponents.filter((c) => c.status === 'NEEDS_UPDATE')

    // Enrich with generation info
    const enriched = await Promise.all(
      needsUpdate.map(async (comp) => {
        const latestGen = await genRepo.getLatestVersion(comp.id)
        return {
          ...comp,
          latestGeneration: latestGen,
        }
      })
    )

    return successResponse({
      components: enriched,
      count: enriched.length,
    })
  } catch (error) {
    console.error('Error fetching components needing update:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch components', 500)
  }
}

/**
 * GET /projects/{projectId}/tokens
 * List all extracted design tokens for the project
 */
export async function getProjectTokensHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Verify project exists and user has access
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) {
      return notFoundResponse('Project not found')
    }

    const tokensRepo = new DesignTokensRepository(client)

    const tokens = await tokensRepo.listByProject(projectId)

    return successResponse({
      tokens,
      count: tokens.length,
    })
  } catch (error) {
    console.error('Error fetching project tokens:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch tokens', 500)
  }
}
