import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FieldProps {
  label: string
  children?: ReactNode
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  error?: string
  hint?: string
  accent?: boolean
  disabled?: boolean
  className?: string
}

export function Field({
  label,
  children,
  value,
  onChange,
  placeholder,
  error,
  hint,
  accent = false,
  disabled = false,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="font-mono text-[8px] uppercase tracking-[0.14em] text-[--text-ghost]">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'bg-[--bg-input] border border-[--border-subtle] rounded-[6px] px-2.5 py-1.5',
            'font-mono text-[10px] text-[--text-secondary]',
            'placeholder-[--text-ghost] placeholder-opacity-50',
            'focus:outline-none focus:border-[--accent-border] transition-colors',
            accent && 'border-[--accent-border] text-[--accent] bg-[--accent-glow]',
            error && 'border-[--red] bg-[--red]/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      )}
      {error && <p className="font-mono text-[8px] text-[--red] mt-1">{error}</p>}
      {hint && <p className="font-mono text-[8px] text-[--text-ghost] mt-1">{hint}</p>}
    </div>
  )
}
