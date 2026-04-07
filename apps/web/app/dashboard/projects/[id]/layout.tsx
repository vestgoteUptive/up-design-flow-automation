/**
 * Project Detail Layout
 * Handles dynamic project routes
 */

import { ReactNode } from 'react'

export function generateStaticParams() {
  return [{ id: 'index' }]
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children
}
