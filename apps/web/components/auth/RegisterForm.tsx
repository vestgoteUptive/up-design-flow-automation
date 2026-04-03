'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type Role = 'creator' | 'designer' | 'developer'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('designer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getPasswordStrength = (pwd: string): number => {
    if (pwd.length === 0) return 0
    if (pwd.length < 6) return 1
    if (pwd.length < 10) return 2
    if (pwd.length < 14) return 3
    return 4
  }

  const strength = getPasswordStrength(password)
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = [
    '',
    'bg-[var(--red)]',
    'bg-[var(--amber)]',
    'bg-[var(--blue)]',
    'bg-[var(--green)]',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.auth.register(email, name, password)
      router.push('/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-6">
      <div
        className="w-full max-w-[380px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-elevated)]"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-[18px] leading-tight mb-1">
            <span className="font-light italic text-[var(--text-secondary)]">Design</span>{' '}
            <span className="font-bold not-italic text-[var(--accent)]">Studio</span>
          </h1>
          <h2 className="font-display text-[22px] font-bold text-[var(--text-primary)] mt-6">
            Create Account
          </h2>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">
            Join the component platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          {error && (
            <div className="font-mono text-[10px] text-[var(--red)] bg-[var(--red-subtle)] border border-[var(--red)] border-opacity-20 rounded-[var(--radius-sm)] p-[8px_12px]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] transition-all"
            />
            {password && (
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={cn(
                      'h-1 flex-1 rounded-full bg-[var(--border-subtle)] transition-all',
                      strength >= segment && strengthColors[strength]
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-ghost)]">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-[8px_12px] font-mono text-[11px] text-[var(--text-primary)] focus:border-[var(--accent-border)] focus:outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] transition-all"
            >
              <option value="creator">Creator</option>
              <option value="designer">Designer</option>
              <option value="developer">Developer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white p-[10px] rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] hover:opacity-90 disabled:opacity-70 transition-all mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Link to login */}
        <p className="font-mono text-[9px] text-[var(--text-faint)] text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
