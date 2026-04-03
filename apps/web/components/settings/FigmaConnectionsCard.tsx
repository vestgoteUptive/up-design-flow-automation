'use client'

import { useState } from 'react'
import { SettingsCard } from './SettingsCard'
import { FigmaConnectionItem } from './FigmaConnectionItem'
import { AddFigmaForm } from './AddFigmaForm'
import type { FigmaConnection } from '@/types'

interface FigmaConnectionsCardProps {
  connections: FigmaConnection[]
  onAdd: (data: { name: string; fileKey: string; accessToken: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function FigmaConnectionsCard({ connections, onAdd, onRemove }: FigmaConnectionsCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async (data: { name: string; fileKey: string; accessToken: string }) => {
    await onAdd(data)
    setIsAdding(false)
  }

  return (
    <SettingsCard
      title="Figma Connections"
      badge={
        connections.length > 0
          ? { variant: 'count', text: `${connections.length} file${connections.length === 1 ? '' : 's'}` }
          : undefined
      }
    >
      {connections.map((connection) => (
        <FigmaConnectionItem
          key={connection.id}
          connection={connection}
          onRemove={onRemove}
        />
      ))}

      {isAdding ? (
        <AddFigmaForm onAdd={handleAdd} onCancel={() => setIsAdding(false)} />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="border border-dashed border-[var(--border-subtle)] rounded-[7px] p-[9px] font-mono text-[10px] text-[var(--text-ghost)] text-center hover:border-[var(--accent-border)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] transition-all"
        >
          + Add Figma file
        </button>
      )}
    </SettingsCard>
  )
}
