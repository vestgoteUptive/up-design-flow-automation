'use client'

import { useState } from 'react'
import { SettingsCard, Field } from './index'
import { cn } from '@/lib/utils'

export interface AgentInstructionsCardProps {
  defaultValue?: string
  onSave?: (value: string) => void
  className?: string
}

export function AgentInstructionsCard({
  defaultValue = '',
  onSave,
  className,
}: AgentInstructionsCardProps) {
  const [instructions, setInstructions] = useState(defaultValue)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave?.(instructions)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsCard title="Agent Instructions" className={className}>
      <div className="space-y-3">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter custom instructions for the design agent..."
          className={cn(
            'w-full bg-[--bg-elevated] border border-[--border-faint] rounded-[7px]',
            'px-[13px] py-[11px] font-mono text-[10px] text-[--text-muted]',
            'placeholder-[--text-ghost] placeholder-opacity-50',
            'focus:outline-none focus:border-[--accent-border] transition-colors',
            'resize-none min-h-[80px] max-h-[200px]',
            'leading-[1.7]'
          )}
        />

        <button
          onClick={handleSave}
          className={cn(
            'px-3 py-1.5 rounded text-[9px] font-mono uppercase tracking-[0.08em]',
            'bg-[--accent-subtle] text-[--accent] border border-[--accent-border]',
            'hover:bg-[--accent] hover:text-white transition-all',
            saved && 'bg-[--green] text-white border-[--green]'
          )}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </SettingsCard>
  )
}
