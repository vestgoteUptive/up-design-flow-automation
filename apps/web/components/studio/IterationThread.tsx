'use client'

import { cn } from '@/lib/utils'

export interface Iteration {
  id: string
  prompt: string
  timestamp: string
  isLatest?: boolean
}

export interface IterationThreadProps {
  iterations?: Iteration[]
  onRefine?: (prompt: string) => void
  className?: string
}

export function IterationThread({ iterations = [], onRefine, className }: IterationThreadProps) {
  return (
    <div
      className={cn(
        'w-[200px] flex-shrink-0 flex flex-col border-l border-[--border-subtle] p-4 overflow-y-auto',
        className
      )}
    >
      {/* Section Label */}
      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--text-ghost] mb-3">
        Iterations
      </p>

      {/* Iteration Items */}
      <div className="flex-1 space-y-3">
        {iterations.map((iter, idx) => {
          const isLatest = iter.isLatest || idx === iterations.length - 1
          return (
            <div key={iter.id} className="flex gap-2">
              {/* Left: Dot and connector */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isLatest ? 'bg-[--accent]' : 'bg-[--border-strong]'
                  )}
                />
                {idx < iterations.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1',
                      isLatest
                        ? 'bg-gradient-to-b from-[--accent-border] to-[--border-faint]'
                        : 'bg-[--border-faint]'
                    )}
                  />
                )}
              </div>

              {/* Right: Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-mono text-[9px] truncate',
                    isLatest ? 'text-[--text-secondary]' : 'text-[--text-faint]'
                  )}
                >
                  {iter.prompt}
                </p>
                <p className="font-mono text-[8px] text-[--text-ghost] mt-0.5">{iter.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Refine Input */}
      <div className="mt-auto pt-3 border-t border-[--border-faint]">
        <textarea
          placeholder="Refine..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey && e.currentTarget.value) {
              onRefine?.(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          className={cn(
            'w-full bg-[--bg-elevated] border border-[--border-subtle] rounded-[6px]',
            'px-2 py-1.5 font-mono text-[9px] text-[--text-ghost]',
            'placeholder-[--text-ghost] placeholder-opacity-50',
            'focus:outline-none focus:border-[--accent-border] transition-colors',
            'resize-none min-h-[60px]'
          )}
        />
      </div>
    </div>
  )
}
