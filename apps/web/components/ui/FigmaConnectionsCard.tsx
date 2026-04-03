'use client'

import { SettingsCard, FigmaConnectionItem, AddFigmaButton } from './index'
import { cn } from '@/lib/utils'

export interface FigmaConnection {
  id: string
  name: string
  fileKey: string
  connected?: boolean
}

export interface FigmaConnectionsCardProps {
  connections?: FigmaConnection[]
  onAddFigma?: () => void
  onConnect?: (id: string) => void
  onDisconnect?: (id: string) => void
  className?: string
}

export function FigmaConnectionsCard({
  connections = [],
  onAddFigma,
  onConnect,
  onDisconnect,
  className,
}: FigmaConnectionsCardProps) {
  return (
    <SettingsCard
      title="Figma Files"
      badge={
        connections.length > 0
          ? { variant: 'count', label: `${connections.length}` }
          : { variant: 'count', label: 'No files' }
      }
      className={className}
    >
      <div className="space-y-2">
        {connections.map((conn) => (
          <FigmaConnectionItem
            key={conn.id}
            name={conn.name}
            fileKey={conn.fileKey}
            connected={conn.connected ?? true}
            onConnect={() => onConnect?.(conn.id)}
            onDisconnect={() => onDisconnect?.(conn.id)}
          />
        ))}
        <AddFigmaButton onClick={onAddFigma || (() => {})} />
      </div>
    </SettingsCard>
  )
}
