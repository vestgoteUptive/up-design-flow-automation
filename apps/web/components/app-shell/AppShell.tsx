'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { StatusStrip } from '../ui'

export interface AppShellProps {
  children: ReactNode
  projectId?: string
  pageName?: string
  projectName?: string
  className?: string
}

export function AppShell({
  children,
  projectId,
  pageName = 'Dashboard',
  projectName,
  className,
}: AppShellProps) {
  return (
    <div className={cn('flex h-screen w-screen flex-row overflow-hidden bg-[--bg-base]', className)}>
      {/* Sidebar */}
      <Sidebar projectId={projectId} projectName={projectName} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar projectName={projectName} pageName={pageName} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Status strip */}
        <StatusStrip
          items={[
            { type: 'ok', label: 'System Online' },
            { type: 'ok', label: 'API Connected' },
          ]}
          lastSaved={{ minutes: 2 }}
        />
      </div>
    </div>
  )
}
