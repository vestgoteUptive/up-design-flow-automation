'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const PROJECTS = [
  { id: '1', name: 'Acme Design', color: '#FF6B6B' },
  { id: '2', name: 'TechFlow', color: '#4ECDC4' },
  { id: '3', name: 'Velocity', color: '#45B7D1' },
]

const NAV_ITEMS = [
  { icon: '✦', label: 'Studio', href: '/studio' },
  { icon: '⊡', label: 'Gallery', href: '/gallery' },
  { icon: '⚙', label: 'Settings', href: '/settings' },
]

export interface SidebarProps {
  projectId?: string
  projectName?: string
  className?: string
}

export function Sidebar({ projectId, projectName, className }: SidebarProps) {
  const router = useRouter()

  return (
    <aside
      className={cn(
        'w-[232px] flex-shrink-0 flex flex-col bg-[--bg-sidebar] border-r border-[--border-subtle]',
        className
      )}
    >
      {/* Brand Block */}
      <div className="border-b border-[--border-faint] px-[18px] py-[20px] pb-4">
        <h1 className="font-display text-[14px] font-light italic text-[--text-secondary]">
          Design <span className="font-bold italic not-italic text-[--accent]">Studio</span>
        </h1>
        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[--text-ghost] mt-1">
          Component Platform
        </p>
      </div>

      {/* Project List */}
      <div className="border-b border-[--border-faint] px-[10px] py-[14px] pb-2">
        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[--text-ghost] px-2 mb-2">
          Projects
        </p>
        <div className="space-y-1">
          {PROJECTS.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}/studio`)}
              className={cn(
                'w-full flex flex-row gap-[9px] px-2 py-[7px] rounded-[7px] items-center',
                'hover:bg-[--bg-hover] transition-colors',
                projectId === project.id && 'bg-[--accent-subtle]'
              )}
            >
              <div
                className="w-[8px] h-[8px] rounded-[2px] flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span
                className={cn(
                  'font-display text-[12px] font-light truncate',
                  projectId === project.id ? 'text-[--text-primary]' : 'text-[--text-muted]'
                )}
              >
                {project.name}
              </span>
            </button>
          ))}
        </div>
        <button className="w-full mt-2 font-mono text-[10px] text-[--text-ghost] py-1 hover:text-[--accent] transition-colors">
          + New project
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav Section */}
      <nav className="border-t border-[--border-faint] p-[10px] space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-row gap-[9px] px-2 py-[7px] rounded-[6px] items-center',
              'hover:bg-[--bg-hover] hover:text-[--text-secondary] transition-colors',
              'text-[--text-faint]'
            )}
          >
            <span className="w-[14px] text-center text-[12px]">{item.icon}</span>
            <span className="font-mono text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Row */}
      <div className="border-t border-[--border-faint] px-[10px] py-[14px] flex flex-row gap-[9px] items-center">
        <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[--accent] to-[#C2410C] flex items-center justify-center flex-shrink-0">
          <span className="font-display text-[11px] font-bold text-white">HC</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[11px] font-normal text-[--text-secondary] truncate">
            Henrik
          </p>
          <p className="font-mono text-[8px] uppercase text-[--text-ghost]">Creator</p>
        </div>
        <button className="text-[--text-ghost] hover:text-[--text-faint] transition-colors font-mono text-[9px]">
          ↪
        </button>
      </div>
    </aside>
  )
}
