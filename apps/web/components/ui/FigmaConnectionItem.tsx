import { cn } from '@/lib/utils'

export interface FigmaConnectionItemProps {
  name: string
  fileKey: string
  connected?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  className?: string
}

export function FigmaConnectionItem({
  name,
  fileKey,
  connected = true,
  onConnect,
  onDisconnect,
  className,
}: FigmaConnectionItemProps) {
  return (
    <div
      className={cn(
        'bg-[--bg-elevated] border border-[--border-faint] rounded-[7px] p-[11px] flex flex-row gap-[9px] items-center',
        className
      )}
    >
      {/* Figma Icon */}
      <div className="flex-shrink-0 w-[26px] h-[26px] bg-[--bg-surface] border border-[--border-subtle] rounded-[6px] flex items-center justify-center">
        <span className="font-display text-[11px] italic text-[--accent]">F</span>
      </div>

      {/* Name and Key */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-[--text-primary] truncate">{name}</p>
        <p className="font-mono text-[8px] text-[--text-ghost] truncate mt-0.5">{fileKey}</p>
      </div>

      {/* Status Dot and Actions */}
      <div className="flex-shrink-0 flex items-center gap-3">
        {connected && (
          <div className="w-1.5 h-1.5 rounded-full bg-[--green] shadow-[0_0_6px_var(--green)]" />
        )}

        {connected && onDisconnect ? (
          <button
            onClick={onDisconnect}
            className="px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-[--red] hover:bg-[--red]/10 rounded transition-colors"
          >
            Disconnect
          </button>
        ) : (
          !connected &&
          onConnect && (
            <button
              onClick={onConnect}
              className="px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-[--accent] hover:bg-[--accent-glow] rounded transition-colors"
            >
              Connect
            </button>
          )
        )}
      </div>
    </div>
  )
}

export interface AddFigmaButtonProps {
  onClick: () => void
  className?: string
}

export function AddFigmaButton({ onClick, className }: AddFigmaButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full border border-dashed border-[--border-subtle] rounded-[7px] p-[9px]',
        'font-mono text-[10px] text-[--text-ghost] text-center',
        'hover:border-[--accent-border] hover:text-[--accent] hover:bg-[--accent-glow]',
        'transition-all duration-200',
        className
      )}
    >
      + Add Figma file
    </button>
  )
}
