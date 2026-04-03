'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type PreviewTab = 'preview' | 'component' | 'story' | 'docs'
export type CodeTab = 'component' | 'story' | 'types' | 'docs'

export interface PreviewPaneProps {
  componentName?: string
  isGenerating?: boolean
  activeTab?: PreviewTab
  onTabChange?: (tab: PreviewTab) => void
  iframeUrl?: string
  className?: string
}

const TAB_LABELS: Record<PreviewTab, string> = {
  preview: 'Preview',
  component: 'Component',
  story: 'Story',
  docs: 'Docs',
}

const CODE_TAB_LABELS: Record<CodeTab, string> = {
  component: 'Component',
  story: 'Story',
  types: 'Types',
  docs: 'Docs',
}

const loadingMessages = [
  'Reading your input...',
  'Designing component...',
  'Writing TypeScript...',
  'Rendering preview...',
]

export function PreviewPane({
  componentName = 'Component',
  isGenerating = false,
  activeTab = 'preview',
  onTabChange,
  iframeUrl,
  className,
}: PreviewPaneProps) {
  const [messageIdx, setMessageIdx] = useState(0)
  const [codeTab, setCodeTab] = useState<CodeTab>('component')

  // Cycle loading message every 2s
  useState(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % loadingMessages.length)
    }, 2000)
    return () => clearInterval(interval)
  })

  const isCodeMode = activeTab === 'component'

  return (
    <div className={cn('flex flex-1 flex-col gap-4 p-6', className)}>
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <h2 className="font-display text-[15px] text-[--text-primary]">{componentName}</h2>

        {/* Tabs */}
        <div className="flex gap-1">
          {(Object.keys(TAB_LABELS) as PreviewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-[9px] font-mono uppercase tracking-widest transition-colors',
                activeTab === tab
                  ? 'bg-[--bg-elevated] text-[--text-primary]'
                  : 'text-[--text-faint] hover:text-[--text-secondary]'
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Preview/Code Area */}
      {isCodeMode && !isGenerating ? (
        // Code View
        <div className="flex-1 flex flex-col border border-[--border-subtle] rounded-[10px] overflow-hidden">
          {/* Code sub-tabs */}
          <div className="flex gap-1 bg-[--bg-elevated] p-2 border-b border-[--border-faint]">
            {(Object.keys(CODE_TAB_LABELS) as CodeTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={cn(
                  'px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest transition-colors',
                  codeTab === tab
                    ? 'bg-[--bg-base] text-[--text-primary]'
                    : 'text-[--text-ghost]'
                )}
              >
                {CODE_TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-y-auto bg-[--bg-base] p-4 font-mono text-[10px] leading-[1.6]">
            <pre className="text-[--text-secondary] whitespace-pre-wrap break-words">
{`// ${CODE_TAB_LABELS[codeTab]} preview
// Content will appear here

export const ${codeTab} = () => {
  return <div>Component Code</div>
}`}
            </pre>
          </div>
        </div>
      ) : isGenerating ? (
        // Loading State
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-[--accent-border] rounded-[10px] bg-[--bg-elevated]/30">
          <div className="w-[120px] h-[120px] border-2 border-dashed border-[--accent-border] rounded-[10px] animate-pulse" />
          <p className="font-mono text-[10px] text-[--text-muted]">
            {loadingMessages[messageIdx]}
          </p>
        </div>
      ) : (
        // Preview with iframe
        <div className="flex-1 border border-[--border-subtle] rounded-[10px] overflow-hidden bg-[--bg-elevated]">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[--text-ghost] font-mono text-[12px]">
              [Preview will render here]
            </div>
          )}
        </div>
      )}
    </div>
  )
}
