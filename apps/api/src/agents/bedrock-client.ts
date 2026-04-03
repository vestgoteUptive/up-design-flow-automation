/**
 * Bedrock client for invoking Claude agents
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'eu-north-1',
})

export interface InvokeAgentOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

/**
 * Invoke Claude model via Bedrock
 * Returns the complete text response
 */
export async function invokeBedrockAgent(options: InvokeAgentOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 1,
    maxTokens = 4096,
  } = options

  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-20250514-v1:0'

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-06-01',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  })

  const response = await client.send(command)

  // Parse response body
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  const content = responseBody.content[0]

  if (content.type === 'text') {
    return content.text
  }

  throw new Error(`Unexpected response type: ${content.type}`)
}

/**
 * Parse component builder output (4 files)
 */
export function parseComponentBuilderOutput(response: string): {
  tsx: string
  types: string
  stories: string
  docs: string
} {
  const filePattern = /===FILE:\s*([^=]+?)===\n([\s\S]*?)===END FILE===/g
  const files: Record<string, string> = {}

  let match
  while ((match = filePattern.exec(response)) !== null) {
    const filename = match[1].trim()
    const content = match[2].trim()
    files[filename] = content
  }

  // Extract by file extension
  const tsx = Object.entries(files).find(([name]) => name.endsWith('.tsx'))?.[1] || ''
  const types = Object.entries(files).find(([name]) => name.endsWith('.types.ts'))?.[1] || ''
  const stories = Object.entries(files).find(([name]) => name.endsWith('.stories.tsx'))?.[1] || ''
  const docs = Object.entries(files).find(([name]) => name.endsWith('.docs.mdx'))?.[1] || ''

  if (!tsx || !types) {
    throw new Error('Missing required files in agent response. Expected at least component.tsx and component.types.ts')
  }

  return { tsx, types, stories, docs }
}

/**
 * Parse design importer output (ComponentSpec JSON)
 */
export function parseDesignImporterOutput(response: string): unknown {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Failed to parse design importer response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
