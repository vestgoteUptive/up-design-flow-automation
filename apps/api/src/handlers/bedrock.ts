/**
 * Bedrock agent Lambda handler
 * Invokes Claude agents for design import and component generation
 */

import { getClient } from '@design-studio/db'
import {
  createIteration,
  updateIdea,
  getIdeaById,
  getProjectById,
} from '@design-studio/db'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { Iteration } from '@design-studio/types'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/responses'
import { extractToken, verifyToken } from '../utils/jwt'
import { v4 as uuid } from 'uuid'
import { invokeBedrockAgent, parseComponentBuilderOutput, parseDesignImporterOutput } from '../agents/bedrock-client'
import { designImporterSystemPrompt, designImporterUserPromptTemplate } from '../agents/design-importer-prompt'
import { componentBuilderSystemPrompt, componentBuilderUserPromptTemplate } from '../agents/component-builder-prompt'

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
 * POST /ideas/{ideaId}/iterate - Generate a new iteration via Bedrock
 */
export async function iterateIdeaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return unauthorizedResponse()
    }

    const { projectId, ideaId } = event.pathParameters || {}
    if (!projectId || !ideaId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and Idea ID are required', 400)
    }

    const body = JSON.parse(event.body || '{}')
    const { prompt } = body

    if (!prompt) {
      return errorResponse('VALIDATION_ERROR', 'Prompt is required', 400)
    }

    const client = getClient()

    // Fetch idea to ensure it exists
    const idea = await getIdeaById(client, projectId, ideaId)
    if (!idea) {
      return notFoundResponse('Idea')
    }

    // Fetch project for agent instructions
    const project = await getProjectById(client, projectId)
    if (!project) {
      return notFoundResponse('Project')
    }

    try {
      // Step 1: Run Design Importer to get ComponentSpec
      const designImporterResponse = await invokeBedrockAgent({
        systemPrompt: designImporterSystemPrompt,
        userPrompt: designImporterUserPromptTemplate(JSON.stringify(idea.sourceData)),
        maxTokens: 2048,
      })

      const componentSpec = parseDesignImporterOutput(designImporterResponse)

      // Step 2: Run Component Builder to generate code
      const builderUserPrompt = componentBuilderUserPromptTemplate(
        JSON.stringify(componentSpec),
        prompt,
        project.agentInstructions || '',
      )

      const componentBuilderResponse = await invokeBedrockAgent({
        systemPrompt: componentBuilderSystemPrompt,
        userPrompt: builderUserPrompt,
        maxTokens: 4096,
      })

      const { tsx: generatedCode } = parseComponentBuilderOutput(componentBuilderResponse)

      // Step 3: Save iteration
      const iterationId = uuid()
      const iteration: Iteration = {
        id: iterationId,
        ideaId,
        prompt,
        generatedCode,
        createdAt: new Date().toISOString(),
      }

      await createIteration(client, iteration)

      // Update idea status to REVIEWED
      await updateIdea(client, projectId, ideaId, {
        status: 'REVIEWED',
        updatedAt: new Date().toISOString(),
      })

      return successResponse(iteration, 201)
    } catch (bedrockError) {
      console.error('Bedrock error:', bedrockError)
      return errorResponse(
        'BEDROCK_ERROR',
        `Failed to generate component: ${bedrockError instanceof Error ? bedrockError.message : 'Unknown error'}`,
        500,
      )
    }
  } catch (error) {
    console.error('Iterate idea error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to generate iteration', 500)
  }
}

/**
 * POST /bedrock/import - Design Importer agent
 * Normalizes Figma/URL/Prompt into ComponentSpec
 */
export async function importDesignHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { sourceType, sourceData, userPrompt } = body

    if (!sourceType) {
      return errorResponse('VALIDATION_ERROR', 'sourceType is required', 400)
    }

    try {
      const response = await invokeBedrockAgent({
        systemPrompt: designImporterSystemPrompt,
        userPrompt: designImporterUserPromptTemplate(JSON.stringify({ sourceType, ...sourceData })),
        maxTokens: 2048,
      })

      const componentSpec = parseDesignImporterOutput(response)
      return successResponse(componentSpec)
    } catch (bedrockError) {
      console.error('Design importer error:', bedrockError)
      return errorResponse(
        'BEDROCK_ERROR',
        `Failed to import design: ${bedrockError instanceof Error ? bedrockError.message : 'Unknown error'}`,
        500,
      )
    }
  } catch (error) {
    console.error('Import design error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to import design', 500)
  }
}
