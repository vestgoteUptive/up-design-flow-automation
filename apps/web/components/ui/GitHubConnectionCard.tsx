'use client'

import { useState } from 'react'
import { SettingsCard, Field } from './index'
import { cn } from '@/lib/utils'

export interface GitHubConnectionCardProps {
  connected?: boolean
  username?: string
  onConnect?: () => void
  onDisconnect?: () => void
  className?: string
}

export function GitHubConnectionCard({
  connected = false,
  username,
  onConnect,
  onDisconnect,
  className,
}: GitHubConnectionCardProps) {
  return (
    <SettingsCard
      title="GitHub Connection"
      badge={
        connected
          ? { variant: 'connected', label: 'Connected' }
          : { variant: 'count', label: 'Not Connected' }
      }
      className={className}
    >
      {connected && username ? (
        <div className="space-y-3">
          <Field label="Username" disabled value={username} />
          <button
            onClick={onDisconnect}
            className={cn(
              'px-3 py-1.5 rounded text-[9px] font-mono uppercase tracking-[0.08em]',
              'bg-[--red-subtle] text-[--red] border border-[--red]/30',
              'hover:bg-[--red] hover:text-white transition-colors'
            )}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-[10px] text-[--text-ghost]">
            Connect your GitHub account to enable automated PR creation and repository management.
          </p>
          <button
            onClick={onConnect}
            className={cn(
              'px-3 py-1.5 rounded text-[9px] font-mono uppercase tracking-[0.08em]',
              'bg-[--accent-subtle] text-[--accent] border border-[--accent-border]',
              'hover:bg-[--accent] hover:text-white transition-colors'
            )}
          >
            Connect GitHub
          </button>
        </div>
      )}
    </SettingsCard>
  )
}
