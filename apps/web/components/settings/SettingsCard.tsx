import { cn } from '@/lib/utils'

interface SettingsCardProps {
  title: string
  badge?: {
    variant: 'connected' | 'count' | 'custom'
    text: string
  }
  children: React.ReactNode
  className?: string
}

export function SettingsCard({ title, badge, children, className }: SettingsCardProps) {
  const badgeClasses = {
    connected: 'bg-[var(--green-subtle)] text-[var(--green)] border-[var(--green-border)]',
    count: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]',
    custom: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]',
  }

  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius)] shadow-[var(--shadow-card)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[13px_16px] border-b border-[var(--border-faint)]">
        <h3 className="font-display text-[13px] font-bold text-[var(--text-primary)] tracking-[-0.01em]">
          {title}
        </h3>
        {badge && (
          <span
            className={cn(
              'font-mono text-[8px] uppercase tracking-[0.1em] px-[7px] py-[2px] rounded-[4px] border',
              badgeClasses[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-[14px_16px] flex flex-col gap-[11px]">
        {children}
      </div>
    </div>
  )
}
