export default function StudioPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text-primary] mb-2">Studio</h1>
        <p className="font-mono text-[10px] text-[--text-ghost] uppercase tracking-widest">
          Select an idea to edit
        </p>
      </div>

      <div className="bg-[--bg-surface] border border-[--border-subtle] rounded-[10px] p-8 text-center">
        <p className="font-mono text-[12px] text-[--text-ghost]">
          Select a project from the sidebar to view studio ideas
        </p>
      </div>
    </div>
  )
}
