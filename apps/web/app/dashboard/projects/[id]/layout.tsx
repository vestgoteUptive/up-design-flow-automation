/**
 * Project Detail Layout
 * Handles dynamic project routes
 */

import { ReactNode } from 'react'

export function generateStaticParams() {
  // Return empty array for static export
  // This route will be handled client-side
  return []
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children
}
