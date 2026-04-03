'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Field } from '../ui'

export interface FigmaPickerPanelProps {
  onNext?: (selection: string[]) => void
  className?: string
}

interface ComponentCard {
  id: string
  name: string
  type: 'group' | 'component'
  count?: number
  nodeId: string
}

const mockComponents: ComponentCard[] = [
  { id: '1', name: 'Button', type: 'component', nodeId: 'node-1' },
  { id: '2', name: 'Card', type: 'component', nodeId: 'node-2' },
  { id: '3', name: 'Input Field', type: 'component', nodeId: 'node-3' },
  { id: '4', name: 'Modal', type: 'component', nodeId: 'node-4' },
  { id: '5', name: 'Dropdown', type: 'component', nodeId: 'node-5' },
  { id: '6', name: 'Tabs', type: 'component', nodeId: 'node-6' },
]

export function FigmaPickerPanel({ onNext, className }: FigmaPickerPanelProps) {
  const [mode, setMode] = useState<'groups' | 'components'>('components')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = mockComponents.filter((comp) =>
    comp.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  return (
    <div className={cn('flex flex-col gap-4 p-6', className)}>
      {/* Toggle bar */}
      <div className="flex gap-2">
        {(['groups', 'components'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-widest transition-colors',
              mode === m
                ? 'bg-[--accent] text-white'
                : 'bg-[--bg-elevated] text-[--text-ghost] hover:bg-[--bg-hover]'
            )}
          >
            {m === 'groups' ? 'Groups' : 'Components'}
          </button>
        ))}
      </div>

      {/* Search */}
      <Field
        label="Search"
        value={search}
        onChange={setSearch}
        placeholder="Search components..."
      />

      {/* Grid */}
      <div className={cn(
        'grid gap-2',
        mode === 'groups' ? 'grid-cols-2' : 'grid-cols-3'
      )}>
        {filtered.map((comp) => (
          <button
            key={comp.id}
            onClick={() => toggleSelection(comp.id)}
            className={cn(
              'bg-[--bg-elevated] border border-[--border-faint] rounded-[8px] overflow-hidden',
              'cursor-pointer transition-all hover:border-[--accent-border]',
              selected.has(comp.id) && 'border-[--accent] shadow-[0_0_0_1px_rgba(var(--accent),0.4)]'
            )}
          >
            {/* Thumbnail */}
            <div className="h-[72px] bg-[--bg-base] flex items-center justify-center">
              <div className="w-[16px] h-[16px] rounded-full bg-[--accent]/20" />
            </div>

            {/* Label */}
            <div className="px-2 py-1.5">
              <p className="font-mono text-[9px] text-[--text-secondary] truncate">{comp.name}</p>
              {comp.count && (
                <p className="font-mono text-[8px] text-[--text-ghost]">{comp.count} variants</p>
              )}
            </div>

            {/* Checkmark */}
            {selected.has(comp.id) && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[--accent] flex items-center justify-center text-white text-[10px] font-bold">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected chips */}
      {selected.size > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Array.from(selected).map((id) => {
            const comp = mockComponents.find((c) => c.id === id)
            return (
              <div
                key={id}
                className="bg-[--accent-subtle] text-[--accent] border border-[--accent-border] rounded px-2 py-1 text-[8px] font-mono uppercase tracking-widest flex items-center gap-1"
              >
                {comp?.name}
                <button onClick={() => toggleSelection(id)} className="ml-1">
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={() => onNext?.(Array.from(selected))}
        disabled={selected.size === 0}
        className={cn(
          'px-4 py-2 rounded text-[9px] font-mono uppercase tracking-widest',
          'border border-[--accent-border] bg-[--accent-subtle] text-[--accent]',
          'hover:bg-[--accent] hover:text-white transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Next →
      </button>
    </div>
  )
}
