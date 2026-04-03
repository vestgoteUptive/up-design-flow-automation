export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[--text-primary] mb-2">
          Dashboard
        </h1>
        <p className="font-mono text-[10px] text-[--text-ghost] uppercase tracking-widest">
          Welcome back
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Projects', value: '3' },
          { label: 'Active Ideas', value: '12' },
          { label: 'Published', value: '8' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 bg-[--bg-surface] border border-[--border-subtle] rounded-[10px]"
          >
            <p className="font-mono text-[9px] text-[--text-ghost] uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p className="font-display text-3xl font-bold text-[--accent]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
