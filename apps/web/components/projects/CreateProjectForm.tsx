'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const PROJECT_COLORS = [
  '#FB923C', // accent orange
  '#4ADE80', // green
  '#60A5FA', // blue
  '#FBBF24', // amber
  '#F87171', // red
  '#A78BFA', // purple
  '#34D399', // emerald
  '#F472B6', // pink
]

export function CreateProjectForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const project = await api.projects.create({ name, description, color })
      router.push(`/projects/${project.id}/studio`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto pt-16">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-[22px] font-bold text-[var(--text-primary)] mb-1">
          Create Project
        </h2>
        <p className="font-mono text-[10px] text-[var(--text-muted)] mb-6">
          Start a new component library project
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          {error && (
            <div className="font-mono text-[10px] text-[var(--red)] bg-[var(--red-subtle)] border border-[var(--red)] border-opacity-20 rounded-[var(--radius-sm)] p-[8px_12px]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Design System"
              required
              maxLength={50}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Component library for our product..."
              rows={3}
              maxLength={200}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] resize-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Color
            </label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-[6px] border-2 transition-all ${
                    color === c
                      ? 'border-[var(--accent)] scale-110'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] p-[10px] rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] hover:border-[var(--border-strong)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--accent)] text-white p-[10px] rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] hover:opacity-90 disabled:opacity-70 transition-all"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
