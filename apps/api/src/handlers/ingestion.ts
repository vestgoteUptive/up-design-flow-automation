/**
 * Ingestion Lambda handler
 * Handles design ingestion results, component selection, generation, and tracking
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
  ComponentSpec,
} from '@design-studio/types'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/responses'
import { extractToken, verifyToken } from '../utils/jwt'
import { invokeBedrockAgent, parseComponentBuilderOutput, parseDesignImporterOutput } from '../agents/bedrock-client'
import { designImporterSystemPrompt, designImporterUserPromptTemplate } from '../agents/design-importer-prompt'
import { componentBuilderSystemPrompt, componentBuilderUserPromptTemplate } from '../agents/component-builder-prompt'

// ============================================================================
// AUTH HELPER
// ============================================================================

async function getCurrentUser(event: APIGatewayProxyEvent) {
  const token = extractToken(event.headers.Authorization)
  if (!token) return null
  return verifyToken(token)
}

// ============================================================================
// INGESTION PROMPT TEMPLATE
// Asks Design Importer to produce an array of components + tokens
// ============================================================================

const ingestionSystemPrompt = `You are a senior design system analyst. Analyze the provided design source and extract a structured list of components and design tokens.

OUTPUT REQUIREMENTS:
Your entire response must be a single valid JSON object matching this schema exactly:

{
  "components": [
    {
      "name": "string (PascalCase)",
      "description": "string (1-2 sentences)",
      "complexityScore": "number (1-10)",
      "tokensUsed": ["token-name-1", "token-name-2"],
      "childComponentNames": ["ChildA", "ChildB"],
      "metadata": {
        "category": "string (e.g. form, navigation, feedback)",
        "estimatedProps": "number"
      }
    }
  ],
  "tokens": [
    {
      "name": "string (kebab-case, e.g. primary-blue)",
      "type": "COLOR | TYPOGRAPHY | SPACING | SHADOW | BORDER_RADIUS | OPACITY",
      "value": "string (e.g. #0066FF, 16px, 1rem)",
      "description": "string (optional)"
    }
  ]
}

Guidelines:
- Extract between 3 and 20 components depending on source complexity
- Include all observable design tokens
- complexityScore 1=trivial, 10=very complex (many states/variants)
- Never output explanations outside the JSON`

function ingestionUserPrompt(sourceType: string, sourceData: unknown): string {
  return `Analyze this design source and extract components and tokens:

Source Type: ${sourceType}
Source Data: ${JSON.stringify(sourceData, null, 2)}

Remember: Return ONLY the JSON object. No explanations.`
}

// ============================================================================
// GET /projects/{projectId}/ingestion
// ============================================================================

export async function getIngestionResultsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const sessionId = event.queryStringParameters?.sessionId

    const components = sessionId
      ? await ingestedRepo.listByIngestion(projectId, sessionId)
      : await ingestedRepo.listByProject(projectId)

    return successResponse({ components, count: components.length })
  } catch (error) {
    console.error('Error fetching ingestion results:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch ingestion results', 500)
  }
}

// ============================================================================
// GET /projects/{projectId}/ingestion/{componentId}
// ============================================================================

export async function getIngestionComponentHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    const componentId = event.pathParameters?.componentId
    if (!projectId || !componentId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and component ID are required', 400)
    }

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const component = await ingestedRepo.getById(projectId, componentId)
    if (!component) return notFoundResponse('Component not found')

    return successResponse(component)
  } catch (error) {
    console.error('Error fetching ingestion component:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch component', 500)
  }
}

// ============================================================================
// POST /projects/{projectId}/ingestion/select
// ============================================================================

export async function selectComponentsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const body = JSON.parse(event.body || '{}')
    const { componentIds } = body

    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Component IDs array is required', 400)
    }

    const ingestedRepo = new IngestedComponentsRepository(client)
    await ingestedRepo.bulkUpdateStatus(projectId, componentIds, 'SELECTED')

    return successResponse({ message: 'Components marked for generation', selectedCount: componentIds.length })
  } catch (error) {
    console.error('Error selecting components:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to select components', 500)
  }
}

// ============================================================================
// POST /projects/{projectId}/ingestion/session
// Starts ingestion: calls Design Importer, stores components + tokens
// ============================================================================

export async function startIngestionSessionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const body = JSON.parse(event.body || '{}')
    const { sourceType, sourceData } = body

    if (!sourceType || !sourceData) {
      return errorResponse('VALIDATION_ERROR', 'sourceType and sourceData are required', 400)
    }

    const sessionId = uuid()
    const sessionRepo = new IngestionSessionsRepository(client)
    const ingestedRepo = new IngestedComponentsRepository(client)
    const tokensRepo = new DesignTokensRepository(client)
    const tokenLinksRepo = new ComponentTokensRepository(client)

    // Persist session as IN_PROGRESS immediately so UI can poll
    const session: IngestionSession = {
      id: sessionId,
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

    try {
      // Invoke Design Importer to discover components and tokens
      const aiResponse = await invokeBedrockAgent({
        systemPrompt: ingestionSystemPrompt,
        userPrompt: ingestionUserPrompt(sourceType, sourceData),
        maxTokens: 4096,
      })

      const parsed = parseIngestionOutput(aiResponse)

      // Persist design tokens first so we have their IDs
      const tokenIdMap = new Map<string, string>() // name → id
      const now = new Date().toISOString()

      await Promise.all(
        parsed.tokens.map(async (t) => {
          const tokenId = uuid()
          tokenIdMap.set(t.name, tokenId)
          const token: DesignToken = {
            id: tokenId,
            projectId,
            type: t.type,
            name: t.name,
            value: t.value,
            description: t.description,
            extractedAt: now,
            usageCount: 0,
          }
          return tokensRepo.create(token)
        }),
      )

      // Persist ingested components
      const components: IngestedComponent[] = parsed.components.map((c) => {
        const compId = uuid()
        const tokensUsed = (c.tokensUsed || [])
          .map((name: string) => tokenIdMap.get(name))
          .filter((id): id is string => Boolean(id))

        return {
          id: compId,
          projectId,
          ingestionId: sessionId,
          name: c.name,
          description: c.description,
          sourceType,
          sourceData,
          complexityScore: c.complexityScore ?? 5,
          tokensUsed,
          childComponentIds: [],
          status: 'DISCOVERED' as const,
          ingestedAt: now,
          metadata: c.metadata ?? {},
        }
      })

      await Promise.all(components.map((comp) => ingestedRepo.create(comp)))

      // Link token usage counts
      await Promise.all(
        components.map(async (comp) => {
          if (comp.tokensUsed.length > 0) {
            await tokenLinksRepo.bulkLinkTokens(
              comp.id,
              comp.tokensUsed.map((id) => ({ tokenId: id, usageCount: 1 })),
            )
            // Increment usage counts on token records
            await Promise.all(
              comp.tokensUsed.map((tokenId) =>
                tokensRepo.incrementUsage(projectId, tokenId, 1),
              ),
            )
          }
        }),
      )

      // Mark session completed
      await sessionRepo.updateStatus(projectId, sessionId, 'COMPLETED', {
        totalComponentsFound: components.length,
        selectedForGeneration: 0,
      })

      return successResponse(
        {
          session: { ...session, status: 'COMPLETED', totalComponentsFound: components.length },
          components,
          tokensFound: parsed.tokens.length,
        },
        201,
      )
    } catch (bedrockError) {
      console.error('Bedrock ingestion error:', bedrockError)
      await sessionRepo.updateStatus(projectId, sessionId, 'FAILED', {
        errorMessage: bedrockError instanceof Error ? bedrockError.message : 'Unknown error',
      })
      return errorResponse(
        'BEDROCK_ERROR',
        `Ingestion failed: ${bedrockError instanceof Error ? bedrockError.message : 'Unknown error'}`,
        500,
      )
    }
  } catch (error) {
    console.error('Error starting ingestion session:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to start ingestion session', 500)
  }
}

// ============================================================================
// POST /projects/{projectId}/ingestion/generate
// Runs Component Builder on all SELECTED components in parallel
// ============================================================================

export async function generateComponentsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    // Get all SELECTED components
    const allComponents = await ingestedRepo.listByProject(projectId)
    const selected = allComponents.filter((c) => c.status === 'SELECTED')

    if (selected.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No components in SELECTED status. Select components first.', 400)
    }

    // Mark all as GENERATING immediately
    await ingestedRepo.bulkUpdateStatus(
      projectId,
      selected.map((c) => c.id),
      'GENERATING',
    )

    // Build a minimal ComponentSpec from the ingested metadata for each component
    const results = await Promise.allSettled(
      selected.map((comp) => generateSingleComponent(comp, project.agentInstructions || '', genRepo, ingestedRepo, projectId)),
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return successResponse({
      message: `Generation complete: ${succeeded} succeeded, ${failed} failed`,
      total: selected.length,
      succeeded,
      failed,
    })
  } catch (error) {
    console.error('Error generating components:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to generate components', 500)
  }
}

async function generateSingleComponent(
  comp: IngestedComponent,
  agentInstructions: string,
  genRepo: ComponentGenerationRepository,
  ingestedRepo: IngestedComponentsRepository,
  projectId: string,
): Promise<void> {
  try {
    // Build a lightweight spec for the Component Builder
    const spec: ComponentSpec = {
      name: comp.name,
      description: comp.description || `A ${comp.name} component`,
      props: [],
      variants: [],
      accessibility: 'Follow WCAG 2.1 AA guidelines. Include keyboard navigation and ARIA attributes.',
      designTokens: {},
    }

    const builderResponse = await invokeBedrockAgent({
      systemPrompt: componentBuilderSystemPrompt,
      userPrompt: componentBuilderUserPromptTemplate(JSON.stringify(spec), agentInstructions),
      maxTokens: 6000,
    })

    const files = parseComponentBuilderOutput(builderResponse)

    const generation: ComponentGeneration = {
      id: uuid(),
      ingestedComponentId: comp.id,
      version: 1,
      status: 'GENERATED',
      generatedCode: {
        component: files.tsx,
        types: files.types,
        stories: files.stories,
        exports: buildBarrelExport(comp.name),
      },
      generatedAt: new Date().toISOString(),
      versionHistory: [
        {
          version: 1,
          generatedAt: new Date().toISOString(),
          notes: 'Initial generation',
        },
      ],
    }

    await genRepo.create(generation)
    await ingestedRepo.updateStatus(projectId, comp.id, 'GENERATED')
  } catch (err) {
    console.error(`Error generating component ${comp.name}:`, err)
    await ingestedRepo.updateStatus(projectId, comp.id, 'INGESTED') // roll back to pre-select
    throw err
  }
}

// ============================================================================
// POST /projects/{projectId}/components/{componentId}/regenerate
// ============================================================================

export async function regenerateComponentHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    const componentId = event.pathParameters?.componentId
    if (!projectId || !componentId) {
      return errorResponse('VALIDATION_ERROR', 'Project ID and component ID are required', 400)
    }

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    const ingestedComponent = await ingestedRepo.getById(projectId, componentId)
    if (!ingestedComponent) return notFoundResponse('Component not found')

    const latestGen = await genRepo.getLatestVersion(componentId)
    if (!latestGen) {
      return errorResponse('GENERATION_ERROR', 'No existing generation found. Use generate endpoint first.', 400)
    }

    const newVersion = latestGen.version + 1
    await ingestedRepo.updateStatus(projectId, componentId, 'REGENERATING')

    try {
      const spec: ComponentSpec = {
        name: ingestedComponent.name,
        description: ingestedComponent.description || `A ${ingestedComponent.name} component`,
        props: [],
        variants: [],
        accessibility: 'Follow WCAG 2.1 AA guidelines. Include keyboard navigation and ARIA attributes.',
        designTokens: {},
      }

      const builderResponse = await invokeBedrockAgent({
        systemPrompt: componentBuilderSystemPrompt,
        userPrompt: componentBuilderUserPromptTemplate(
          JSON.stringify(spec),
          project.agentInstructions || '',
        ),
        maxTokens: 6000,
      })

      const files = parseComponentBuilderOutput(builderResponse)

      const newGeneration: ComponentGeneration = {
        id: uuid(),
        ingestedComponentId: componentId,
        version: newVersion,
        status: 'GENERATED',
        generatedCode: {
          component: files.tsx,
          types: files.types,
          stories: files.stories,
          exports: buildBarrelExport(ingestedComponent.name),
        },
        generatedAt: new Date().toISOString(),
        regeneratedAt: new Date().toISOString(),
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
      await ingestedRepo.updateStatus(projectId, componentId, 'GENERATED')

      return successResponse({ message: 'Regeneration complete', newVersion, generationId: newGeneration.id })
    } catch (bedrockError) {
      console.error('Bedrock regeneration error:', bedrockError)
      await ingestedRepo.updateStatus(projectId, componentId, 'NEEDS_UPDATE')
      return errorResponse(
        'BEDROCK_ERROR',
        `Regeneration failed: ${bedrockError instanceof Error ? bedrockError.message : 'Unknown error'}`,
        500,
      )
    }
  } catch (error) {
    console.error('Error regenerating component:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to regenerate component', 500)
  }
}

// ============================================================================
// GET /projects/{projectId}/components
// ============================================================================

export async function listComponentsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    const components = await ingestedRepo.listByProject(projectId)
    const componentsWithGen = await Promise.all(
      components.map(async (comp) => {
        const latestGen = await genRepo.getLatestVersion(comp.id)
        return { ...comp, latestGeneration: latestGen }
      }),
    )

    return successResponse({ components: componentsWithGen, count: componentsWithGen.length })
  } catch (error) {
    console.error('Error listing components:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list components', 500)
  }
}

// ============================================================================
// GET /projects/{projectId}/components/needs-update
// ============================================================================

export async function getComponentsNeedingUpdateHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const ingestedRepo = new IngestedComponentsRepository(client)
    const genRepo = new ComponentGenerationRepository(client)

    const allComponents = await ingestedRepo.listByProject(projectId)
    const needsUpdate = allComponents.filter((c) => c.status === 'NEEDS_UPDATE')

    const enriched = await Promise.all(
      needsUpdate.map(async (comp) => ({
        ...comp,
        latestGeneration: await genRepo.getLatestVersion(comp.id),
      })),
    )

    return successResponse({ components: enriched, count: enriched.length })
  } catch (error) {
    console.error('Error fetching components needing update:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch components', 500)
  }
}

// ============================================================================
// GET /projects/{projectId}/tokens
// ============================================================================

export async function getProjectTokensHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const tokensRepo = new DesignTokensRepository(client)
    const tokens = await tokensRepo.listByProject(projectId)

    return successResponse({ tokens, count: tokens.length })
  } catch (error) {
    console.error('Error fetching project tokens:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch tokens', 500)
  }
}

// ============================================================================
// POST /projects/{projectId}/ingestion/seed
// Inserts realistic mock data for local testing (no Figma required)
// ============================================================================

export async function seedIngestionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getCurrentUser(event)
    if (!user) return unauthorizedResponse()

    const projectId = event.pathParameters?.projectId
    if (!projectId) return errorResponse('VALIDATION_ERROR', 'Project ID is required', 400)

    const client = getClient()
    const project = await getProjectById(client, projectId)
    if (!project || project.creatorId !== user.userId) return notFoundResponse('Project not found')

    const sessionRepo = new IngestionSessionsRepository(client)
    const ingestedRepo = new IngestedComponentsRepository(client)
    const tokensRepo = new DesignTokensRepository(client)
    const tokenLinksRepo = new ComponentTokensRepository(client)

    const now = new Date().toISOString()
    const sessionId = uuid()

    // Create session
    const session: IngestionSession = {
      id: sessionId,
      projectId,
      createdById: user.userId,
      sourceType: 'PROMPT',
      sourceData: { type: 'PROMPT', text: 'Seed data for testing' },
      totalComponentsFound: 0,
      selectedForGeneration: 0,
      status: 'IN_PROGRESS',
      startedAt: now,
    }
    await sessionRepo.create(session)

    // Seed design tokens
    const seedTokens: Array<{ name: string; type: string; value: string; description: string }> = [
      { name: 'primary-500', type: 'COLOR', value: '#3B82F6', description: 'Primary brand blue' },
      { name: 'primary-700', type: 'COLOR', value: '#1D4ED8', description: 'Dark primary blue' },
      { name: 'neutral-100', type: 'COLOR', value: '#F3F4F6', description: 'Light background' },
      { name: 'neutral-900', type: 'COLOR', value: '#111827', description: 'Near-black text' },
      { name: 'success-500', type: 'COLOR', value: '#10B981', description: 'Success green' },
      { name: 'danger-500', type: 'COLOR', value: '#EF4444', description: 'Error/danger red' },
      { name: 'body-text', type: 'TYPOGRAPHY', value: '16px/1.5 Inter, sans-serif', description: 'Default body text' },
      { name: 'heading-lg', type: 'TYPOGRAPHY', value: '24px/1.25 Inter, sans-serif', description: 'Large heading' },
      { name: 'caption', type: 'TYPOGRAPHY', value: '12px/1.4 Inter, sans-serif', description: 'Caption text' },
      { name: 'spacing-4', type: 'SPACING', value: '16px', description: '4 units spacing' },
      { name: 'spacing-6', type: 'SPACING', value: '24px', description: '6 units spacing' },
      { name: 'spacing-8', type: 'SPACING', value: '32px', description: '8 units spacing' },
      { name: 'radius-md', type: 'BORDER_RADIUS', value: '6px', description: 'Medium border radius' },
      { name: 'shadow-sm', type: 'SHADOW', value: '0 1px 3px rgba(0,0,0,0.12)', description: 'Small shadow' },
    ]

    const tokenIdMap = new Map<string, string>()
    await Promise.all(
      seedTokens.map(async (t) => {
        const tokenId = uuid()
        tokenIdMap.set(t.name, tokenId)
        const token: DesignToken = {
          id: tokenId,
          projectId,
          type: t.type as DesignToken['type'],
          name: t.name,
          value: t.value,
          description: t.description,
          extractedAt: now,
          usageCount: 0,
        }
        return tokensRepo.create(token)
      }),
    )

    // Seed ingested components
    const seedComponents: Array<{
      name: string
      description: string
      complexity: number
      tokens: string[]
    }> = [
      {
        name: 'Button',
        description: 'Primary action button with multiple variants (primary, secondary, ghost) and sizes (sm, md, lg)',
        complexity: 3,
        tokens: ['primary-500', 'primary-700', 'neutral-100', 'body-text', 'radius-md'],
      },
      {
        name: 'TextField',
        description: 'Form input with label, helper text, and error state. Supports controlled/uncontrolled usage.',
        complexity: 5,
        tokens: ['neutral-100', 'neutral-900', 'danger-500', 'body-text', 'radius-md', 'spacing-4'],
      },
      {
        name: 'Modal',
        description: 'Accessible dialog overlay with header, content, and footer slots. Supports size variants.',
        complexity: 7,
        tokens: ['neutral-100', 'neutral-900', 'shadow-sm', 'body-text', 'radius-md', 'spacing-6'],
      },
      {
        name: 'DataTable',
        description: 'Sortable, filterable data table with pagination and row selection. Virtualized for large datasets.',
        complexity: 9,
        tokens: ['neutral-100', 'neutral-900', 'primary-500', 'body-text', 'spacing-4', 'spacing-6'],
      },
      {
        name: 'Avatar',
        description: 'User avatar component with image, initials fallback, and size variants.',
        complexity: 2,
        tokens: ['primary-500', 'neutral-100', 'body-text', 'radius-md'],
      },
      {
        name: 'Badge',
        description: 'Status badge for labeling items with semantic color variants (success, warning, error, info).',
        complexity: 2,
        tokens: ['success-500', 'danger-500', 'primary-500', 'caption', 'radius-md'],
      },
      {
        name: 'Card',
        description: 'Content container with optional header, footer, and media sections. Supports hover elevation.',
        complexity: 4,
        tokens: ['neutral-100', 'neutral-900', 'shadow-sm', 'radius-md', 'spacing-6'],
      },
      {
        name: 'Dropdown',
        description: 'Accessible select dropdown with search, multi-select, and grouped options support.',
        complexity: 8,
        tokens: ['neutral-100', 'neutral-900', 'primary-500', 'body-text', 'radius-md', 'shadow-sm'],
      },
      {
        name: 'Sidebar',
        description: 'Collapsible navigation sidebar with nested items, icons, and active state indicators.',
        complexity: 6,
        tokens: ['primary-500', 'neutral-100', 'neutral-900', 'body-text', 'spacing-4', 'spacing-6'],
      },
      {
        name: 'Toast',
        description: 'Notification toast with auto-dismiss, manual close, and semantic variants (success, error, info).',
        complexity: 5,
        tokens: ['success-500', 'danger-500', 'primary-500', 'body-text', 'radius-md', 'shadow-sm'],
      },
    ]

    const components: IngestedComponent[] = seedComponents.map((c) => {
      const compId = uuid()
      const tokensUsed = c.tokens
        .map((name) => tokenIdMap.get(name))
        .filter((id): id is string => Boolean(id))

      return {
        id: compId,
        projectId,
        ingestionId: sessionId,
        name: c.name,
        description: c.description,
        sourceType: 'PROMPT' as const,
        sourceData: { type: 'PROMPT' as const, text: 'Seed data' },
        complexityScore: c.complexity,
        tokensUsed,
        childComponentIds: [],
        status: 'DISCOVERED' as const,
        ingestedAt: now,
        metadata: {},
      }
    })

    await Promise.all(components.map((comp) => ingestedRepo.create(comp)))

    // Link token usage
    await Promise.all(
      components.map(async (comp) => {
        if (comp.tokensUsed.length > 0) {
          await tokenLinksRepo.bulkLinkTokens(
            comp.id,
            comp.tokensUsed.map((id) => ({ tokenId: id, usageCount: 1 })),
          )
          await Promise.all(
            comp.tokensUsed.map((tokenId) => tokensRepo.incrementUsage(projectId, tokenId, 1)),
          )
        }
      }),
    )

    await sessionRepo.updateStatus(projectId, sessionId, 'COMPLETED', {
      totalComponentsFound: components.length,
    })

    return successResponse(
      {
        message: 'Seed data created successfully',
        sessionId,
        componentsCreated: components.length,
        tokensCreated: seedTokens.length,
        components: components.map((c) => ({ id: c.id, name: c.name, status: c.status })),
      },
      201,
    )
  } catch (error) {
    console.error('Error seeding ingestion data:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to seed ingestion data', 500)
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function parseIngestionOutput(response: string): {
  components: Array<{
    name: string
    description: string
    complexityScore: number
    tokensUsed: string[]
    childComponentNames: string[]
    metadata: Record<string, unknown>
  }>
  tokens: Array<{
    name: string
    type: DesignToken['type']
    value: string
    description?: string
  }>
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.components) || !Array.isArray(parsed.tokens)) {
      throw new Error('Response missing components or tokens arrays')
    }
    return parsed
  } catch (error) {
    throw new Error(
      `Failed to parse ingestion output: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

function buildBarrelExport(componentName: string): string {
  return `export { ${componentName}, default } from './${componentName}'
export type { ${componentName}Props } from './${componentName}.types'
`
}
