import { AgentInstructionsCard, GitHubConnectionCard, FigmaConnectionsCard } from '@/components/ui'

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text-primary] mb-2">Settings</h1>
        <p className="font-mono text-[10px] text-[--text-ghost] uppercase tracking-widest">
          Project configuration & connections
        </p>
      </div>

      <AgentInstructionsCard 
        defaultValue="Design components that are accessible and well-documented."
      />

      <GitHubConnectionCard 
        connected={false}
      />

      <FigmaConnectionsCard 
        connections={[
          { id: '1', name: 'Main Design System', fileKey: 'abc123def456', connected: true },
          { id: '2', name: 'Component Library', fileKey: 'xyz789uvw456', connected: true },
        ]}
      />
    </div>
  )
}
