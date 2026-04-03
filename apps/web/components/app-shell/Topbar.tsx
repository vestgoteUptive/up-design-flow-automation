'use client'

import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'

export interface TopbarProps {
  projectName?: string
  pageName?: string
  className?: string
}

export function Topbar({ projectName = 'Project', pageName = 'Dashboard', className }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <header
      className={cn(
        'h-[50px] border-b border-[--border-subtle] px-7 flex flex-row items-center justify-between',
        'bg-[--bg-base]',
        className
      )}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[--text-faint]">{projectName}</span>
        <span className="font-mono text-[10px] text-[--text-ghost]">/</span>
        <span className="font-mono text-[10px] text-[--accent]">{pageName}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[10px]">
        <button
          onClick={toggle}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'hover:bg-[--bg-hover] transition-colors',
            'font-mono text-[12px]'
          )}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
