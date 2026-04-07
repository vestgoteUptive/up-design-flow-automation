/**
 * Project Detail Client Component
 * Handles ingestion sessions, component selection, generation, tokens, and status tracking
 */

'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import type { IngestedComponent, ComponentGeneration, DesignToken } from '@design-studio/types'
import { api } from '@/lib/api'
import { generateMockProject } from '@/lib/mock-data'

type TabType = 'ingestion' | 'components' | 'tokens' | 'settings'

type ActionState = 'idle' | 'loading' | 'success' | 'error'

interface ActionStatus {
  state: ActionState
  message: string
}

interface ProjectDetailClientProps {
  demoMode?: boolean
}

export default function ProjectDetailClient({ demoMode = false }: ProjectDetailClientProps) {
  const params = useParams()
  const projectId = demoMode ? 'demo-project' : (params?.id as string)

  const [activeTab, setActiveTab] = useState<TabType>('ingestion')
  const [components, setComponents] = useState<IngestedComponent[]>([])
  const [generatedComponents, setGeneratedComponents] = useState<Array<IngestedComponent & { latestGeneration?: ComponentGeneration }>>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [tokens, setTokens] = useState<DesignToken[]>([])
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState<ActionStatus>({ state: 'idle', message: '' })

  const fetchIngestion = useCallback(async () => {
    if (!projectId || demoMode) return
    try {
      const [comps, toks] = await Promise.all([
        api.ingestion.getComponents(projectId),
        api.ingestion.getTokens(projectId),
      ])
      setComponents(comps || [])
      setTokens(toks || [])
    } catch (err) {
      console.error('Error fetching ingestion data:', err)
    }
  }, [projectId, demoMode])

  const fetchGenerated = useCallback(async () => {
    if (!projectId || demoMode) return
    try {
      const comps = await api.ingestion.listComponents(projectId)
      setGeneratedComponents(comps || [])
    } catch (err) {
      console.error('Error fetching generated components:', err)
    }
  }, [projectId, demoMode])

  // Initial data load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (demoMode) {
          const mockData = generateMockProject(12)
          setComponents(mockData.components)
          setTokens(mockData.tokens)
        } else {
          await Promise.all([fetchIngestion(), fetchGenerated()])
        }
      } finally {
        setLoading(false)
      }
    }
    if (projectId) load()
  }, [projectId, demoMode, fetchIngestion, fetchGenerated])

  // Refetch when switching to components tab
  useEffect(() => {
    if (activeTab === 'components' && !demoMode) {
      fetchGenerated()
    }
  }, [activeTab, demoMode, fetchGenerated])

  const setAction = (state: ActionState, message: string) =>
    setActionStatus({ state, message })

  const clearAction = () => setActionStatus({ state: 'idle', message: '' })

  // ── Selection ──────────────────────────────────────────────────────────────

  const handleSelectComponent = (componentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(componentId) ? next.delete(componentId) : next.add(componentId)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === components.length ? new Set() : new Set(components.map((c) => c.id)),
    )
  }

  // ── Seed (test data) ───────────────────────────────────────────────────────

  const handleSeed = async () => {
    if (demoMode) return
    setAction('loading', 'Creating seed data...')
    try {
      const result = await api.ingestion.seedData(projectId)
      await fetchIngestion()
      setAction('success', `Seeded ${result.componentsCreated} components and ${result.tokensCreated} tokens.`)
    } catch (err) {
      setAction('error', err instanceof Error ? err.message : 'Failed to seed data')
    }
  }

  // ── Start ingestion session (prompt-based) ─────────────────────────────────

  const handleStartIngestion = async (promptText: string) => {
    if (demoMode) return
    setAction('loading', 'Running Design Importer agent...')
    try {
      const result = await api.ingestion.startSession(projectId, 'PROMPT', { type: 'PROMPT', text: promptText })
      await fetchIngestion()
      setAction(
        'success',
        `Ingestion complete — ${result.session.totalComponentsFound} components discovered, ${result.tokensFound} tokens extracted.`,
      )
    } catch (err) {
      setAction('error', err instanceof Error ? err.message : 'Ingestion failed')
    }
  }

  // ── Mark selected → SELECTED status ───────────────────────────────────────

  const handleMarkSelected = async () => {
    if (selectedIds.size === 0) return
    setAction('loading', `Marking ${selectedIds.size} components for generation...`)
    try {
      if (!demoMode) {
        await api.ingestion.selectComponents(projectId, Array.from(selectedIds))
        await fetchIngestion()
      }
      setSelectedIds(new Set())
      setAction('success', `${selectedIds.size} components marked for generation.`)
    } catch (err) {
      setAction('error', err instanceof Error ? err.message : 'Failed to select components')
    }
  }

  // ── Generate selected components ───────────────────────────────────────────

  const handleGenerate = async () => {
    if (demoMode) return
    const selectedCount = components.filter((c) => c.status === 'SELECTED').length
    if (selectedCount === 0) {
      setAction('error', 'No components are in SELECTED status. Mark some components first.')
      return
    }
    setAction('loading', `Generating ${selectedCount} components via Claude... This may take a minute.`)
    try {
      const result = await api.ingestion.generateComponents(projectId)
      await Promise.all([fetchIngestion(), fetchGenerated()])
      setAction(
        result.failed > 0 ? 'error' : 'success',
        `${result.message}`,
      )
    } catch (err) {
      setAction('error', err instanceof Error ? err.message : 'Generation failed')
    }
  }

  if (!projectId) {
    return <div className="p-8 text-center text-red-600">Invalid project ID</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
            <p className="text-gray-500 mt-1 font-mono text-sm">{projectId}</p>
          </div>
          {!demoMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeed}
                disabled={actionStatus.state === 'loading'}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Seed Test Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action status banner */}
      {actionStatus.state !== 'idle' && (
        <div
          className={`border-b px-8 py-3 text-sm flex items-center justify-between ${
            actionStatus.state === 'loading'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : actionStatus.state === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionStatus.state === 'loading' && (
              <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            {actionStatus.message}
          </div>
          {actionStatus.state !== 'loading' && (
            <button onClick={clearAction} className="text-xs underline opacity-70 hover:opacity-100">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex space-x-8" role="tablist">
            {(['ingestion', 'components', 'tokens', 'settings'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                className={`px-1 py-4 border-b-2 font-medium text-sm transition capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading && (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        )}

        {!loading && activeTab === 'ingestion' && (
          <IngestionTab
            components={components}
            selectedIds={selectedIds}
            demoMode={demoMode}
            isWorking={actionStatus.state === 'loading'}
            onSelectComponent={handleSelectComponent}
            onSelectAll={handleSelectAll}
            onMarkSelected={handleMarkSelected}
            onGenerate={handleGenerate}
            onStartIngestion={handleStartIngestion}
          />
        )}

        {!loading && activeTab === 'components' && (
          <ComponentsTab components={generatedComponents.length > 0 ? generatedComponents : components} />
        )}

        {!loading && activeTab === 'tokens' && (
          <TokensTab tokens={tokens} />
        )}

        {!loading && activeTab === 'settings' && (
          <SettingsTab projectId={projectId} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Ingestion Tab
// ============================================================================

function IngestionTab({
  components,
  selectedIds,
  demoMode,
  isWorking,
  onSelectComponent,
  onSelectAll,
  onMarkSelected,
  onGenerate,
  onStartIngestion,
}: {
  components: IngestedComponent[]
  selectedIds: Set<string>
  demoMode: boolean
  isWorking: boolean
  onSelectComponent: (id: string) => void
  onSelectAll: () => void
  onMarkSelected: () => void
  onGenerate: () => void
  onStartIngestion: (prompt: string) => void
}) {
  const [promptText, setPromptText] = useState('')
  const [showIngestionForm, setShowIngestionForm] = useState(false)

  const selectedCount = components.filter((c) => c.status === 'SELECTED').length
  const generatedCount = components.filter((c) => c.status === 'GENERATED').length

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Discovered" value={components.length} />
        <StatCard label="Selected" value={selectedCount} highlight />
        <StatCard label="Generated" value={generatedCount} />
        <StatCard label="Checked" value={selectedIds.size} />
      </div>

      {/* Actions bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap items-center gap-3">
        <button
          onClick={onSelectAll}
          disabled={components.length === 0}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-40"
        >
          {selectedIds.size === components.length && components.length > 0 ? 'Deselect All' : 'Select All'}
        </button>

        <span className="text-sm text-gray-500">{selectedIds.size} checked</span>

        <div className="flex-1" />

        {!demoMode && (
          <button
            onClick={() => setShowIngestionForm((v) => !v)}
            disabled={isWorking}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {showIngestionForm ? 'Cancel' : '+ New Ingestion'}
          </button>
        )}

        <button
          onClick={onMarkSelected}
          disabled={selectedIds.size === 0 || isWorking}
          className="px-4 py-2 text-sm font-medium border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
        >
          Mark Selected ({selectedIds.size})
        </button>

        {!demoMode && (
          <button
            onClick={onGenerate}
            disabled={selectedCount === 0 || isWorking}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Generate ({selectedCount})
          </button>
        )}
      </div>

      {/* New ingestion form */}
      {showIngestionForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Start New Ingestion Session</h3>
          <p className="text-sm text-gray-600">
            Describe the design system or components you want to ingest. Claude will analyse and extract components and tokens.
          </p>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. A SaaS dashboard with navigation, data tables, forms, and a notification system. Uses blue as the primary color."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowIngestionForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (promptText.trim()) {
                  onStartIngestion(promptText.trim())
                  setShowIngestionForm(false)
                  setPromptText('')
                }
              }}
              disabled={!promptText.trim() || isWorking}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Run Ingestion
            </button>
          </div>
        </div>
      )}

      {/* Component list */}
      {components.length === 0 ? (
        <EmptyState
          title="No components discovered yet"
          description={
            demoMode
              ? 'This is the demo mode. In production, use the Seed button or start an ingestion session.'
              : 'Click "Seed Test Data" to populate with sample components, or use "+ New Ingestion" to run the Design Importer agent.'
          }
        />
      ) : (
        <div className="space-y-2">
          {components.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              selected={selectedIds.has(component.id)}
              onSelect={() => onSelectComponent(component.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Component Row
// ============================================================================

function ComponentRow({
  component,
  selected,
  onSelect,
}: {
  component: IngestedComponent
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`p-4 border rounded-lg transition cursor-pointer ${
        selected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
        />

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 truncate">{component.name}</h3>
            <StatusBadge status={component.status} />
          </div>
          {component.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{component.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
            {component.complexityScore != null && (
              <span>Complexity {component.complexityScore}/10</span>
            )}
            {component.tokensUsed?.length > 0 && (
              <span>{component.tokensUsed.length} tokens</span>
            )}
            {component.childComponentIds?.length != null && component.childComponentIds.length > 0 && (
              <span>{component.childComponentIds.length} children</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Components Tab (generated)
// ============================================================================

function ComponentsTab({ components }: { components: Array<IngestedComponent & { latestGeneration?: ComponentGeneration }> }) {
  const generatedCount = components.filter((c) => c.status === 'GENERATED').length
  const needsUpdateCount = components.filter((c) => c.status === 'NEEDS_UPDATE').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Components" value={components.length} />
        <StatCard label="Generated" value={generatedCount} />
        <StatCard label="Needs Update" value={needsUpdateCount} />
      </div>

      {components.length === 0 ? (
        <EmptyState
          title="No components generated yet"
          description='Select components on the Ingestion tab and click "Generate" to build them with Claude.'
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {components.map((component) => (
                <tr key={component.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{component.name}</p>
                      {component.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{component.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={component.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {component.latestGeneration ? `v${component.latestGeneration.version}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {component.latestGeneration
                      ? new Date(component.latestGeneration.generatedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tokens Tab
// ============================================================================

function TokensTab({ tokens }: { tokens: DesignToken[] }) {
  const colorTokens = tokens.filter((t) => t.type === 'COLOR')
  const typographyTokens = tokens.filter((t) => t.type === 'TYPOGRAPHY')
  const spacingTokens = tokens.filter((t) => t.type === 'SPACING')
  const otherTokens = tokens.filter((t) => !['COLOR', 'TYPOGRAPHY', 'SPACING'].includes(t.type))

  if (tokens.length === 0) {
    return (
      <EmptyState
        title="No design tokens extracted yet"
        description="Tokens are extracted automatically during ingestion. Seed test data or run an ingestion session to see tokens."
      />
    )
  }

  return (
    <div className="space-y-8">
      {colorTokens.length > 0 && <TokenSection title="Colors" tokens={colorTokens} showSwatch />}
      {typographyTokens.length > 0 && <TokenSection title="Typography" tokens={typographyTokens} />}
      {spacingTokens.length > 0 && <TokenSection title="Spacing" tokens={spacingTokens} />}
      {otherTokens.length > 0 && <TokenSection title="Other" tokens={otherTokens} />}
    </div>
  )
}

function TokenSection({ title, tokens, showSwatch = false }: { title: string; tokens: DesignToken[]; showSwatch?: boolean }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tokens.map((token) => (
          <div key={token.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
            {showSwatch && (
              <div
                className="w-10 h-10 rounded-md border border-gray-200 flex-shrink-0 mt-0.5"
                style={{ backgroundColor: token.value }}
              />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{token.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{token.type}</p>
              <p className="text-xs font-mono text-gray-700 mt-1 truncate">{token.value}</p>
              {token.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{token.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Used by {token.usageCount} component{token.usageCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Settings Tab
// ============================================================================

function SettingsTab({ projectId }: { projectId: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Project Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project ID</label>
          <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">{projectId}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">API Base URL</label>
          <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Shared primitives
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DISCOVERED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    INGESTED: 'bg-blue-50 text-blue-700 border-blue-200',
    SELECTED: 'bg-purple-50 text-purple-700 border-purple-200',
    GENERATING: 'bg-orange-50 text-orange-700 border-orange-200',
    GENERATED: 'bg-green-50 text-green-700 border-green-200',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEEDS_UPDATE: 'bg-red-50 text-red-700 border-red-200',
    REGENERATING: 'bg-orange-50 text-orange-700 border-orange-200',
    DEPRECATED: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  const cls = styles[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls} flex-shrink-0`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-lg py-16 px-8 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{description}</p>
    </div>
  )
}
