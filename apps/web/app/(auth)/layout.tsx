'use client'

import { useEffect, useState } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('ds-theme') as 'light' | 'dark' | null
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    const resolved = stored || system
    setTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  return <>{children}</>
}
