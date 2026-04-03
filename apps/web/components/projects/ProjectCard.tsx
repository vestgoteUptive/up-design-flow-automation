import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  isJoined: boolean
  onJoin?: (projectId: string) => void
  className?: string
}

export function ProjectCard({ project, isJoined, onJoin, className }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}/studio`}
      className={cn(
        'block bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius)] shadow-[var(--shadow-card)] p-[18px] hover:shadow-[var(--shadow-elevated)] hover:border-[var(--border-strong)] transition-all cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-[10px] h-[10px] rounded-[3px] flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {isJoined ? (
          <span className="font-mono text-[8px] text-[var(--text-ghost)]">✓ Joined</span>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              onJoin?.(project.id)
            }}
            className="font-mono text-[9px] text-[var(--accent)] border border-[var(--accent-border)] px-[9px] py-[3px] rounded-[4px] hover:bg-[var(--accent-subtle)] transition-colors"
          >
            Join
          </button>
        )}
      </div>

      <h3 className="font-display text-[15px] font-bold text-[var(--text-primary)] mb-2">
        {project.name}
      </h3>

      <p className="font-mono text-[10px] text-[var(--text-muted)] leading-[1.6] line-clamp-2 mb-4">
        {project.description}
      </p>

      <div className="flex items-center gap-3 font-mono text-[9px] text-[var(--text-ghost)]">
        <span>N members</span>
        <span>by Creator</span>
      </div>
    </Link>
  )
}
