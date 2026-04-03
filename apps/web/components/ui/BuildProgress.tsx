import { cn } from '@/lib/utils'

export interface BuildProgressProps {
  status: 'idle' | 'building' | 'success' | 'error'
  progress?: number
  message?: string
  className?: string
}

export function BuildProgress({ status, progress = 0, message, className }: BuildProgressProps) {
  const statusStyles = {
    idle: 'bg-[--bg-elevated] text-[--text-muted]',
    building: 'bg-[--amber-subtle] text-[--amber] animate-pulse',
    success: 'bg-[--green-subtle] text-[--green]',
    error: 'bg-[--red-subtle] text-[--red]',
  }

  const statusLabels = {
    idle: 'Idle',
    building: 'Building...',
    success: 'Success',
    error: 'Error',
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('px-3 py-2 rounded text-[8px] font-mono uppercase tracking-widest font-medium', statusStyles[status])}>
        {statusLabels[status]}
      </div>

      {status === 'building' && (
        <>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[--bg-elevated] rounded-full overflow-hidden">
            <div
              className="h-full bg-[--accent] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Message */}
          {message && (
            <p className="font-mono text-[9px] text-[--text-ghost]">{message}</p>
          )}
        </>
      )}
    </div>
  )
}
