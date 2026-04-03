'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type InputType = 'figma' | 'url' | 'prompt'

export interface InputSelectorProps {
  onSelect?: (type: InputType) => void
  defaultSelected?: InputType
  className?: string
}

const inputs = [
  {
    id: 'figma' as const,
    icon: '⬡',
    title: 'From Figma',
    description: 'Select a component from your Figma files',
  },
  {
    id: 'url' as const,
    icon: '⊕',
    title: 'From URL',
    description: 'Paste a URL to a design system or documentation',
  },
  {
    id: 'prompt' as const,
    icon: '✎',
    title: 'From Prompt',
    description: 'Describe the component you want to build',
  },
]

export function InputSelector({ onSelect, defaultSelected, className }: InputSelectorProps) {
  const [selected, setSelected] = useState<InputType | null>(defaultSelected ?? null)

  const handleSelect = (type: InputType) => {
    setSelected(type)
    onSelect?.(type)
  }

  return (
    <div className={cn('flex flex-row gap-3 px-8 py-10', className)}>
      {inputs.map((input) => (
        <button
          key={input.id}
          onClick={() => handleSelect(input.id)}
          className={cn(
            'flex-1 flex flex-col items-center bg-[--bg-surface] border border-[--border-subtle] rounded-[14px]',
            'px-6 py-7 cursor-pointer transition-all duration-200',
            'hover:border-[--accent-border] hover:shadow-[0_0_0_1px_var(--accent-border)]',
            selected === input.id && [
              'border-[--accent] shadow-[0_0_0_1px_var(--accent),var(--shadow-elevated)]',
            ],
            selected && selected !== input.id && [
              'opacity-40 pointer-events-none',
            ]
          )}
        >
          <span className="text-[24px] text-[--accent] mb-4">{input.icon}</span>
          <h3 className="font-display text-[15px] font-bold text-[--text-primary] mb-1.5">
            {input.title}
          </h3>
          <p className="font-mono text-[10px] text-[--text-muted] text-center leading-[1.6]">
            {input.description}
          </p>
        </button>
      ))}
    </div>
  )
}
