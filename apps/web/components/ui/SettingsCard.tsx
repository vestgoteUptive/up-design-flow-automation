import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SettingsCardProps {
  title: string
  children: ReactNode
  badge?: {
    variant: 'connected' | 'count' | 'custom'
    label: string
  }
  icon?: ReactNode
  className?: string
}

export function SettingsCard({ title, children, badge, icon, className }: SettingsCardProps) {
  const badgeVariants = {
    connected: 'bg-[--green-subtle] text-[--green] border border-[--green-border]',
    count: 'bg-[--bg-elevated] text-[--text-muted] border border-[--border-subtle]',
    custom: 'bg-[--accent-subtle] text-[--accent] border border-[--accent-border]',
  }

  return (
    <div
      className={cn(
        'bg-[--bg-surface] border border-[--border-subtle] rounded-[10px] shadow-[--shadow-card]',
        className
      )}
    >
      <div className="border-b border-[--border-faint] px-4 py-[13px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-[--accent]">{icon}</div>}
          <h3 className="font-display text-[13px] font-bold text-[--text-primary] tracking-[-0.01em]">
            {title}
          </h3>
        </div>
        {badge && (
          <span
            className={cn(
              'px-[7px] py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-medium whitespace-nowrap',
              badgeVariants[badge.variant]
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="px-4 py-[14px] flex flex-col gap-[11px]">{children}</div>
    </div>
  )
}
