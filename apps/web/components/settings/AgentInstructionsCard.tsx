'use client'

import { useState, useEffect } from 'react'
import { SettingsCard } from './SettingsCard'

interface AgentInstructionsCardProps {
  initialInstructions: string
  onSave: (instructions: string) => Promise<void>
}

export function AgentInstructionsCard({
  initialInstructions,
  onSave,
}: AgentInstructionsCardProps) {
  const [instructions, setInstructions] = useState(initialInstructions)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIsDirty(instructions !== initialInstructions)
  }, [instructions, initialInstructions])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(instructions)
      setIsDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard
      title="Agent Instructions"
      badge={isDirty ? { variant: 'custom', text: 'Modified' } : undefined}
    >
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
          Custom Prompt
        </label>
        <div className="relative">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add custom instructions for the AI agent..."
            rows={6}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-faint)] rounded-[7px] p-[11px_13px] font-mono text-[10px] text-[var(--text-muted)] leading-[1.7] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none resize-none transition-all"
          />
          <style jsx>{`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            textarea:focus + .cursor-blink {
              display: block;
            }
            .cursor-blink {
              display: none;
              width: 1px;
              height: 11px;
              background: var(--accent);
              animation: blink 1.1s step-end infinite;
            }
          `}</style>
        </div>
      </div>

      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] p-[5px_12px] rounded-[var(--radius-sm)] font-mono text-[9px] uppercase tracking-[0.08em] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50 transition-all self-start"
        >
          {saving ? 'Saving...' : 'Save Instructions'}
        </button>
      )}
    </SettingsCard>
  )
}
