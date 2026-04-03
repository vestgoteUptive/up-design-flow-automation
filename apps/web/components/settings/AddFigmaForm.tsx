'use client'

import { useState } from 'react'

interface AddFigmaFormProps {
  onAdd: (data: { name: string; fileKey: string; accessToken: string }) => Promise<void>
  onCancel: () => void
}

export function AddFigmaForm({ onAdd, onCancel }: AddFigmaFormProps) {
  const [name, setName] = useState('')
  const [fileKey, setFileKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onAdd({ name, fileKey, accessToken })
      setName('')
      setFileKey('')
      setAccessToken('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[11px] bg-[var(--bg-elevated)] border border-[var(--border-faint)] rounded-[7px] p-[11px_13px]">
      {error && (
        <div className="font-mono text-[9px] text-[var(--red)] bg-[var(--red-subtle)] border border-[var(--red)] border-opacity-20 rounded-[4px] p-[6px_8px]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
          File Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Design System"
          required
          className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[6px_10px] font-mono text-[10px] text-[var(--text-secondary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
          File Key
        </label>
        <input
          type="text"
          value={fileKey}
          onChange={(e) => setFileKey(e.target.value)}
          placeholder="abc123def456"
          required
          className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[6px_10px] font-mono text-[10px] text-[var(--text-secondary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
          Access Token
        </label>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="figd_..."
          required
          className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[6px_10px] font-mono text-[10px] text-[var(--text-secondary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none transition-all"
        />
      </div>

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] p-[5px_12px] rounded-[var(--radius-sm)] font-mono text-[9px] uppercase tracking-[0.08em] hover:border-[var(--border-strong)] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] p-[5px_12px] rounded-[var(--radius-sm)] font-mono text-[9px] uppercase tracking-[0.08em] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50 transition-all"
        >
          {loading ? 'Adding...' : 'Add File'}
        </button>
      </div>
    </form>
  )
}
