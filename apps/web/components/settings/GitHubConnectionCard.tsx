'use client'

import { SettingsCard } from './SettingsCard'

interface GitHubConnectionCardProps {
  repoUrl?: string
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function GitHubConnectionCard({
  repoUrl,
  isConnected,
  onConnect,
  onDisconnect,
}: GitHubConnectionCardProps) {
  return (
    <SettingsCard
      title="GitHub Repository"
      badge={isConnected ? { variant: 'connected', text: 'Connected' } : undefined}
    >
      {isConnected && repoUrl ? (
        <>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Repository
            </label>
            <div className="bg-[var(--accent-glow)] border border-[var(--accent-border)] rounded-[var(--radius-sm)] p-[6px_10px]">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-[var(--accent)] hover:underline"
              >
                {repoUrl}
              </a>
            </div>
          </div>

          <button
            onClick={onDisconnect}
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] p-[5px_12px] rounded-[var(--radius-sm)] font-mono text-[9px] uppercase tracking-[0.08em] hover:border-[var(--border-strong)] transition-all self-start"
          >
            Disconnect
          </button>
        </>
      ) : (
        <>
          <p className="font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
            Connect a GitHub repository to enable automatic PR creation and component publishing.
          </p>

          <button
            onClick={onConnect}
            className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] p-[5px_12px] rounded-[var(--radius-sm)] font-mono text-[9px] uppercase tracking-[0.08em] hover:bg-[var(--accent)] hover:text-white transition-all self-start"
          >
            Connect GitHub
          </button>
        </>
      )}
    </SettingsCard>
  )
}
