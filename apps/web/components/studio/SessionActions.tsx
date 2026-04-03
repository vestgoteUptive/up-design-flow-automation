'use client'

import { cn } from '@/lib/utils'

export interface SessionActionsProps {
  onBack?: () => void
  onMarkReviewed?: () => void
  hasIterations?: boolean
  className?: string
}

export function SessionActions({
  onBack,
  onMarkReviewed,
  hasIterations = false,
  className,
}: SessionActionsProps) {
  return (
    <div
      className={cn(
        'h-[44px] bg-[--bg-sidebar] border-t border-[--border-faint]',
        'px-6 flex flex-row items-center justify-between',
        className
      )}
    >
      {/* Back button */}
      <button
        onClick={() => {
          if (hasIterations) {
            const confirmed = window.confirm(
              'Start over? Your iterations will be lost.'
            )
            if (confirmed) onBack?.()
          } else {
            onBack?.()
          }
        }}
        className="font-mono text-[10px] text-[--text-faint] hover:text-[--text-secondary] transition-colors"
      >
        ← Back to input
      </button>

      {/* Mark as reviewed button */}
      <button
        onClick={onMarkReviewed}
        className={cn(
          'px-[14px] py-1.5 rounded text-[10px] font-mono uppercase tracking-widest',
          'border border-[--accent-border] text-[--accent]',
          'hover:bg-[--accent-subtle] transition-colors'
        )}
      >
        Mark as Reviewed →
      </button>
    </div>
  )
}
