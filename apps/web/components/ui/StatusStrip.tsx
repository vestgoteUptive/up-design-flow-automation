import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatusType = 'ok' | 'warn' | 'error'

export interface StatusItem {
  type: StatusType
  label: string
}

export interface StatusStripProps {
  items: StatusItem[]
  lastSaved?: {
    minutes: number
  }
  className?: string
}

export function StatusStrip({ items, lastSaved, className }: StatusStripProps) {
  const statusColors: Record<StatusType, { bg: string; glow: string }> = {
    ok: { bg: 'bg-[--green]', glow: 'shadow-[0_0_4px_var(--green)]' },
    warn: { bg: 'bg-[--amber]', glow: '' },
    error: { bg: 'bg-[--red]', glow: '' },
  }

  return (
    <div
      className={cn(
        'h-[30px] bg-[--bg-sidebar] border-t border-[--border-faint]',
        'px-7 flex flex-row gap-5 items-center',
        className
      )}
    >
      {/* Status items */}
      {items.map((item, idx) => {
        const colors = statusColors[item.type]
        return (
          <div key={idx} className="flex flex-row gap-1.5 items-center">
            <div className={cn('w-1.5 h-1.5 rounded-full', colors.bg, colors.glow)} />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[--text-ghost]">
              {item.label}
            </span>
          </div>
        )
      })}

      {/* Last saved time (right-aligned) */}
      {lastSaved && (
        <div className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-[--text-ghost]">
          Last saved {lastSaved.minutes} min ago
        </div>
      )}
    </div>
  )
}
