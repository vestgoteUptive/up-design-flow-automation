import { ProjectCard } from './ProjectCard'
import type { Project } from '@/types'

interface ProjectGridProps {
  projects: Project[]
  userProjectIds: string[]
  onJoin?: (projectId: string) => void
  title?: string
  showCount?: boolean
}

export function ProjectGrid({
  projects,
  userProjectIds,
  onJoin,
  title = 'Projects',
  showCount = false,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-[var(--radius)] border border-[var(--border-faint)] flex items-center justify-center mb-3">
          <span className="text-[var(--text-ghost)] text-xl">⊕</span>
        </div>
        <p className="font-display text-[14px] text-[var(--text-muted)] mb-3">
          No projects yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-ghost)]">
          {title}
          {showCount && ` (${projects.length})`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-fr">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isJoined={userProjectIds.includes(project.id)}
            onJoin={onJoin}
          />
        ))}
      </div>
    </div>
  )
}
