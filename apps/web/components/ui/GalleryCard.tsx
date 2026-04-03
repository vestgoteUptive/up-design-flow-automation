import { cn } from '@/lib/utils'
import { IdeaStatus } from '@/types'
import { StatusBadge } from './StatusBadge'

export interface GalleryCardProps {
  componentName: string
  authorName: string
  source: 'figma' | 'url' | 'prompt'
  status: IdeaStatus
  relativeDate: string
  thumbnailUrl?: string
  onSendToBuild?: () => void
  onClick?: () => void
  className?: string
}

const statusBorderColors: Record<IdeaStatus, string> = {
  REVIEWED: 'border-l-[--border-strong]',
  BUILDING: 'border-l-[--amber]',
  PR_OPEN: 'border-l-[--blue]',
  VERIFIED: 'border-l-[--green]',
  PUBLISHED: 'border-l-[--green]',
  FAILED: 'border-l-[--red]',
  DRAFTING: 'border-l-[--border-strong]',
}

const sourceLabels: Record<string, string> = {
  figma: 'Figma',
  url: 'URL',
  prompt: 'Prompt',
}

export function GalleryCard({
  componentName,
  authorName,
  source,
  status,
  relativeDate,
  thumbnailUrl,
  onSendToBuild,
  onClick,
  className,
}: GalleryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[--bg-surface] border border-[--border-subtle] border-l-4 rounded-[10px]',
        'shadow-[--shadow-card] hover:shadow-[--shadow-elevated] hover:cursor-pointer',
        'transition-shadow duration-200 overflow-hidden',
        statusBorderColors[status],
        className
      )}
    >
      {/* Thumbnail */}
      <div className="h-[140px] bg-[--bg-elevated] border-b border-[--border-faint] flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={componentName}
            className="object-contain w-full h-full p-2"
          />
        ) : (
          <div className="text-[--text-ghost] font-mono text-[12px]">[Preview]</div>
        )}
      </div>

      {/* Card body */}
      <div className="px-[14px] py-[12px]">
        {/* Component name */}
        <h3 className="font-display text-[14px] font-normal text-[--text-primary] mb-2">
          {componentName}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-mono text-[10px] text-[--text-ghost]">by {authorName}</span>
          <div className="w-[2px] h-[2px] bg-[--border-strong] rounded-full" />
          <span className="font-mono text-[10px] text-[--text-ghost]">{sourceLabels[source]}</span>
          <div className="w-[2px] h-[2px] bg-[--border-strong] rounded-full" />
          <span className="font-mono text-[10px] text-[--text-ghost]">{relativeDate}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={status} />
          {status === 'REVIEWED' && onSendToBuild && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSendToBuild()
              }}
              className={cn(
                'px-3 py-1.5 text-[8px] font-mono uppercase tracking-widest',
                'bg-[--accent-subtle] text-[--accent] border border-[--accent-border]',
                'hover:bg-[--accent] hover:text-white transition-colors rounded'
              )}
            >
              Send to Build
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
