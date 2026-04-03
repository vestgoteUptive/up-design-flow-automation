export default function ProjectsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text-primary] mb-2">Projects</h1>
        <p className="font-mono text-[10px] text-[--text-ghost] uppercase tracking-widest">
          Select a project to continue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: 1, name: 'Acme Design', color: '#FF6B6B' },
          { id: 2, name: 'TechFlow', color: '#4ECDC4' },
          { id: 3, name: 'Velocity', color: '#45B7D1' },
        ].map((project) => (
          <button
            key={project.id}
            className="p-6 bg-[--bg-surface] border border-[--border-subtle] rounded-[10px] hover:shadow-[--shadow-elevated] transition-shadow text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: project.color }}
              />
              <h2 className="font-display text-[16px] font-bold text-[--text-primary]">
                {project.name}
              </h2>
            </div>
            <p className="font-mono text-[9px] text-[--text-ghost] uppercase tracking-widest">
              Click to open
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
