/**
 * Project Detail Client Component
 * Handles ingestion, generation, tokens, and status tracking
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { IngestedComponent, ComponentGeneration, DesignToken } from '@design-studio/types'
import { api } from '@/lib/api'
import { generateMockProject } from '@/lib/mock-data'

type TabType = 'ingestion' | 'components' | 'tokens' | 'settings'

interface ProjectDetailClientProps {
  demoMode?: boolean
}

export default function ProjectDetailClient({ demoMode = false }: ProjectDetailClientProps) {
  const params = useParams()
  const router = useRouter()
  const projectId = demoMode ? 'demo-project' : (params?.id as string)

  const [activeTab, setActiveTab] = useState<TabType>('ingestion')
  const [components, setComponents] = useState<IngestedComponent[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [tokens, setTokens] = useState<DesignToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (demoMode) {
          // Use mock data in demo mode
          const mockData = generateMockProject(12)
          setComponents(mockData.components)
          setTokens(mockData.tokens)
        } else {
          // Fetch from API in production mode
          const [comps, toks] = await Promise.all([
            api.ingestion.getComponents(projectId),
            api.ingestion.getTokens(projectId),
          ])

          setComponents(comps || [])
          setTokens(toks || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId, activeTab, demoMode])

  const handleSelectComponent = (componentId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId)
    } else {
      newSelected.add(componentId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === components.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(components.map((c) => c.id)))
    }
  }

  const handleGenerateSelected = async () => {
    try {
      setLoading(true)
      if (!demoMode) {
        await api.ingestion.selectComponents(projectId, Array.from(selectedIds))
      }
      setSelectedIds(new Set())
      alert(`Successfully selected ${selectedIds.size} components for generation!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select components')
    } finally {
      setLoading(false)
    }
  }

  if (!projectId) {
    return (
      <div className="p-8 text-center text-red-600">Invalid project ID</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
          <p className="text-gray-600 mt-1">ID: {projectId}</p>
        </div>
      </div>

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
                className={`px-1 py-4 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {loading && activeTab === 'ingestion' && (
          <div className="text-center py-12 text-gray-600">
            Loading components...
          </div>
        )}

        {/* Ingestion Tab */}
        {activeTab === 'ingestion' && !loading && (
          <IngestionTab
            components={components}
            selectedIds={selectedIds}
            onSelectComponent={handleSelectComponent}
            onSelectAll={handleSelectAll}
            onGenerate={handleGenerateSelected}
          />
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <ComponentsTab components={components} />
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <TokensTab tokens={tokens} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab projectId={projectId} />
        )}
      </div>
    </div>
  )
}

/**
 * Ingestion Tab - Component discovery and selection
 */
function IngestionTab({
  components,
  selectedIds,
  onSelectComponent,
  onSelectAll,
  onGenerate,
}: {
  components: IngestedComponent[]
  selectedIds: Set<string>
  onSelectComponent: (id: string) => void
  onSelectAll: () => void
  onGenerate: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Design Components Discovered</h2>
        <p className="text-blue-800">
          Found {components.length} components ready for generation
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onSelectAll}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition"
          >
            {selectedIds.size === components.length && components.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </button>
          <span className="text-sm text-gray-600">
            {selectedIds.size} of {components.length} selected
          </span>
        </div>

        <button
          onClick={onGenerate}
          disabled={selectedIds.size === 0}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Generate Selected ({selectedIds.size})
        </button>
      </div>

      {/* Components Grid */}
      <div className="space-y-3">
        {components.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-600">
            No components discovered yet. Start an ingestion session.
          </div>
        ) : (
          components.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              selected={selectedIds.has(component.id)}
              onSelect={() => onSelectComponent(component.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Component Row - Single component in list
 */
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
          className="mt-1 w-5 h-5 accent-blue-600"
        />

        {component.previewUrl && (
          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src={component.previewUrl}
              alt={component.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900">{component.name}</h3>
          {component.description && (
            <p className="text-sm text-gray-600 mt-1">{component.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-600">
            {component.complexityScore && <span>Complexity: {component.complexityScore}/10</span>}
            {component.tokensUsed?.length && <span>Tokens: {component.tokensUsed.length}</span>}
            {component.childComponentIds?.length && <span>Children: {component.childComponentIds.length}</span>}
          </div>
        </div>

        <StatusBadge status={component.status} />
      </div>
    </div>
  )
}

/**
 * Components Tab - Generated components with status
 */
function ComponentsTab({ components }: { components: IngestedComponent[] }) {
  const generatedCount = components.filter((c) => c.status === 'GENERATED').length
  const needsUpdateCount = components.filter((c) => c.status === 'NEEDS_UPDATE').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Components" value={components.length} />
        <StatCard label="Generated" value={generatedCount} />
        <StatCard label="Needs Update" value={needsUpdateCount} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {components.map((component) => (
              <tr key={component.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{component.name}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={component.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">v1</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(component.ingestedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Tokens Tab - Design tokens gallery
 */
function TokensTab({ tokens }: { tokens: DesignToken[] }) {
  const colorTokens = tokens.filter((t) => t.type === 'COLOR')
  const typographyTokens = tokens.filter((t) => t.type === 'TYPOGRAPHY')
  const spacingTokens = tokens.filter((t) => t.type === 'SPACING')

  return (
    <div className="space-y-8">
      {colorTokens.length > 0 && (
        <TokensSection title="Colors" tokens={colorTokens} />
      )}
      {typographyTokens.length > 0 && (
        <TokensSection title="Typography" tokens={typographyTokens} />
      )}
      {spacingTokens.length > 0 && (
        <TokensSection title="Spacing" tokens={spacingTokens} />
      )}

      {tokens.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No design tokens extracted yet.
        </div>
      )}
    </div>
  )
}

/**
 * Tokens Section
 */
function TokensSection({ title, tokens }: { title: string; tokens: DesignToken[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tokens.map((token) => (
          <div key={token.id} className="p-4 border border-gray-200 rounded-lg">
            <p className="font-medium text-gray-900">{token.name}</p>
            <p className="text-xs text-gray-600 mt-1">{token.type}</p>
            <p className="text-sm text-gray-900 mt-2 font-mono">{token.value}</p>
            <p className="text-xs text-gray-500 mt-2">Used by {token.usageCount} components</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Settings Tab
 */
function SettingsTab({ projectId }: { projectId: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project ID</label>
          <p className="text-sm text-gray-900 mt-1 font-mono">{projectId}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Status Badge
 */
function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    DISCOVERED: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    INGESTED: { bg: 'bg-blue-50', text: 'text-blue-700' },
    SELECTED: { bg: 'bg-purple-50', text: 'text-purple-700' },
    GENERATING: { bg: 'bg-orange-50', text: 'text-orange-700' },
    GENERATED: { bg: 'bg-green-50', text: 'text-green-700' },
    NEEDS_UPDATE: { bg: 'bg-red-50', text: 'text-red-700' },
  }

  const colors = statusColors[status] || { bg: 'bg-gray-50', text: 'text-gray-700' }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} flex-shrink-0`}>
      {status}
    </span>
  )
}

/**
 * Stat Card
 */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}
