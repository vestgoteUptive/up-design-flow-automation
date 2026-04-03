import { IdeaStatus } from '@/types'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  status: IdeaStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<IdeaStatus, string> = {
    REVIEWED: 'bg-[--bg-elevated] text-[--text-muted] border border-[--border-subtle]',
    BUILDING: 'bg-[--amber-subtle] text-[--amber] border border-[rgba(var(--amber-rgb),0.3)] animate-pulse',
    PR_OPEN: 'bg-[--blue-subtle] text-[--blue] border border-[rgba(var(--blue-rgb),0.3)]',
    VERIFIED: 'bg-[--green-subtle] text-[--green] border border-[--green-border]',
    PUBLISHED: 'bg-[--green] text-white border-none',
    FAILED: 'bg-[--red-subtle] text-[--red] border border-[rgba(var(--red-rgb),0.3)]',
    DRAFTING: 'bg-[--bg-elevated] text-[--text-muted] border border-[--border-subtle]',
  }

  const labels: Record<IdeaStatus, string> = {
    REVIEWED: 'Reviewed',
    BUILDING: 'Building',
    PR_OPEN: 'PR Open',
    VERIFIED: 'Verified',
    PUBLISHED: 'Published',
    FAILED: 'Failed',
    DRAFTING: 'Drafting',
  }

  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-medium',
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  )
}
