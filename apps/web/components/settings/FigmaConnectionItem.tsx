import type { FigmaConnection } from '@/types'

interface FigmaConnectionItemProps {
  connection: FigmaConnection
  onRemove: (id: string) => void
}

export function FigmaConnectionItem({ connection, onRemove }: FigmaConnectionItemProps) {
  return (
    <div className="flex items-center gap-[9px] bg-[var(--bg-elevated)] border border-[var(--border-faint)] rounded-[7px] p-[9px_11px]">
      {/* Figma icon */}
      <div className="w-[26px] h-[26px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[6px] flex items-center justify-center flex-shrink-0">
        <span className="font-display text-[11px] italic text-[var(--accent)]">F</span>
      </div>

      {/* Connection info */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] text-[var(--text-primary)] truncate">
          {connection.name}
        </div>
        <div className="font-mono text-[8px] text-[var(--text-ghost)] mt-[2px] truncate">
          {connection.fileKey}
        </div>
      </div>

      {/* Status dot */}
      <div className="w-[6px] h-[6px] rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)] flex-shrink-0" />

      {/* Remove button */}
      <button
        onClick={() => onRemove(connection.id)}
        className="font-mono text-[10px] text-[var(--text-ghost)] hover:text-[var(--red)] transition-colors ml-2"
        aria-label="Remove connection"
      >
        ×
      </button>
    </div>
  )
}
