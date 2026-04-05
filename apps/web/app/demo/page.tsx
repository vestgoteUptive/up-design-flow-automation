/**
 * Demo page for ingestion system testing
 * This page shows the ingestion UI with mock data
 */

'use client'

import { useState } from 'react'
import { generateMockProject } from '@/lib/mock-data'
import ProjectDetailClient from '@/app/dashboard/projects/[id]/client'

export default function DemoPage() {
  const [showDemo, setShowDemo] = useState(true)

  if (!showDemo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button
          onClick={() => setShowDemo(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Show Demo
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Demo header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Ingestion System Demo</h1>
              <p className="text-blue-100">
                This page demonstrates the complete ingestion UI with mock data.
              </p>
            </div>
            <button
              onClick={() => setShowDemo(false)}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              Close Demo
            </button>
          </div>
        </div>
      </div>

      {/* Mock data info */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mx-8 mt-8 rounded">
        <h2 className="font-bold text-blue-900 mb-2">📝 About This Demo</h2>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            This page uses <code className="bg-white px-1 rounded">mock-data.ts</code> to
            generate realistic component and token data
          </li>
          <li>The UI below is the full ingestion interface with 4 tabs</li>
          <li>In production, this would connect to the live API endpoints</li>
          <li>
            See <code className="bg-white px-1 rounded">apps/web/lib/mock-data.ts</code> to
            modify mock data
          </li>
        </ul>
      </div>

      {/* Main demo UI */}
      <div className="max-w-7xl mx-auto p-8">
        <ProjectDetailClient demoMode={true} />
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border-t p-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">🚀 Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">1. Explore Components</h3>
              <p className="text-gray-600 text-sm">
                Click the <strong>Ingestion</strong> tab to see discovered components. Select
                components for generation.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">2. View Status</h3>
              <p className="text-gray-600 text-sm">
                The <strong>Components</strong> tab shows generation status and version history
                for each component.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">3. Review Tokens</h3>
              <p className="text-gray-600 text-sm">
                The <strong>Tokens</strong> tab displays all extracted design tokens grouped by
                type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
