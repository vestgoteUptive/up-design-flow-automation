/**
 * Mock Data Generator for Ingestion System Testing
 * 
 * This file generates realistic test data for the ingestion system.
 * Use this to test the frontend UI and API endpoints.
 */

import type {
  IngestedComponent,
  ComponentGeneration,
  DesignToken,
  IngestionSession,
} from '@design-studio/types'
import { v4 as uuid } from 'uuid'

const componentNames = [
  'Button',
  'Card',
  'Modal',
  'Input',
  'Dropdown',
  'Navigation Bar',
  'Footer',
  'Header',
  'Sidebar',
  'Breadcrumb',
  'Tabs',
  'Badge',
  'Alert',
  'Tooltip',
  'Skeleton',
]

const colorTokens = [
  { name: 'primary-blue', value: '#0066FF' },
  { name: 'primary-light', value: '#E6F2FF' },
  { name: 'danger-red', value: '#FF3B30' },
  { name: 'success-green', value: '#34C759' },
  { name: 'warning-orange', value: '#FF9500' },
  { name: 'neutral-gray', value: '#8E8E93' },
  { name: 'neutral-light', value: '#F2F2F7' },
  { name: 'neutral-dark', value: '#1C1C1E' },
]

const typographyTokens = [
  { name: 'heading-xl', value: '32px / 700 Roboto' },
  { name: 'heading-lg', value: '24px / 600 Roboto' },
  { name: 'heading-md', value: '18px / 600 Roboto' },
  { name: 'body-text', value: '16px / 400 Roboto' },
  { name: 'body-small', value: '14px / 400 Roboto' },
  { name: 'caption', value: '12px / 400 Roboto' },
]

const spacingTokens = [
  { name: 'spacing-xs', value: '4px' },
  { name: 'spacing-sm', value: '8px' },
  { name: 'spacing-md', value: '16px' },
  { name: 'spacing-lg', value: '24px' },
  { name: 'spacing-xl', value: '32px' },
  { name: 'spacing-2xl', value: '48px' },
]

/**
 * Generate mock ingested components
 */
export function generateMockComponents(count: number = 10): IngestedComponent[] {
  const components: IngestedComponent[] = []

  for (let i = 0; i < count; i++) {
    const name = componentNames[i % componentNames.length] + (i > componentNames.length ? ` ${Math.floor(i / componentNames.length)}` : '')
    components.push({
      id: uuid(),
      projectId: 'project-001',
      ingestionId: 'session-001',
      name,
      description: `A reusable ${name} component for the design system`,
      sourceType: 'FIGMA',
      sourceData: {
        type: 'FIGMA',
        connectionId: 'figma-001',
        nodeIds: [`node-${i}`],
        componentNames: [name],
      },
      previewUrl: `https://via.placeholder.com/200x200?text=${encodeURIComponent(name)}`,
      complexityScore: Math.floor(Math.random() * 8) + 2,
      tokensUsed: getRandomTokens(2, 5),
      childComponentIds: i % 3 === 0 ? [uuid(), uuid()] : undefined,
      status: ['DISCOVERED', 'INGESTED', 'SELECTED'][Math.floor(Math.random() * 3)] as any,
      ingestedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    })
  }

  return components
}

/**
 * Generate mock design tokens
 */
export function generateMockTokens(): DesignToken[] {
  const tokens: DesignToken[] = []

  colorTokens.forEach((token) => {
    tokens.push({
      id: `token-${token.name}`,
      projectId: 'project-001',
      type: 'COLOR',
      name: token.name,
      value: token.value,
      sourceId: `figma-${token.name}`,
      extractedAt: new Date().toISOString(),
      usageCount: Math.floor(Math.random() * 15) + 1,
    })
  })

  typographyTokens.forEach((token) => {
    tokens.push({
      id: `token-${token.name}`,
      projectId: 'project-001',
      type: 'TYPOGRAPHY',
      name: token.name,
      value: token.value,
      sourceId: `figma-${token.name}`,
      extractedAt: new Date().toISOString(),
      usageCount: Math.floor(Math.random() * 20) + 1,
    })
  })

  spacingTokens.forEach((token) => {
    tokens.push({
      id: `token-${token.name}`,
      projectId: 'project-001',
      type: 'SPACING',
      name: token.name,
      value: token.value,
      sourceId: `figma-${token.name}`,
      extractedAt: new Date().toISOString(),
      usageCount: Math.floor(Math.random() * 25) + 1,
    })
  })

  return tokens
}

/**
 * Generate mock component generations
 */
export function generateMockGenerations(
  components: IngestedComponent[]
): ComponentGeneration[] {
  return components
    .filter((c) => c.status !== 'DISCOVERED')
    .map((component) => ({
      id: uuid(),
      ingestedComponentId: component.id,
      version: 1,
      status: 'GENERATED' as const,
      generatedCode: {
        component: `export default function ${component.name}() { /* ... */ }`,
        types: `export interface ${component.name}Props { /* ... */ }`,
        stories: `export default { title: '${component.name}' }`,
        exports: `export { default } from './${component.name}'`,
      },
      generatedAt: new Date().toISOString(),
      sourceUpdatedAt: undefined,
      versionHistory: [
        {
          version: 1,
          generatedAt: new Date().toISOString(),
          notes: 'Initial generation',
        },
      ],
    }))
}

/**
 * Generate mock ingestion session
 */
export function generateMockSession(): IngestionSession {
  return {
    id: 'session-001',
    projectId: 'project-001',
    createdById: 'user-001',
    sourceType: 'FIGMA',
    sourceData: {
      type: 'FIGMA',
      connectionId: 'figma-001',
      nodeIds: ['page-node-001'],
      componentNames: ['Components'],
    },
    totalComponentsFound: 15,
    selectedForGeneration: 10,
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date().toISOString(),
  }
}

/**
 * Helper: Get random tokens
 */
function getRandomTokens(min: number, max: number): string[] {
  const allTokens = [...colorTokens, ...typographyTokens, ...spacingTokens]
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = allTokens.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count).map((t) => `token-${t.name}`)
}

/**
 * Export all mock data for a project
 */
export function generateMockProject(componentCount: number = 15) {
  const components = generateMockComponents(componentCount)
  const tokens = generateMockTokens()
  const generations = generateMockGenerations(components)
  const session = generateMockSession()

  return {
    components,
    tokens,
    generations,
    session,
  }
}
