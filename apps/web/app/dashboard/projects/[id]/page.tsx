/**
 * Project Detail Page
 */

import ProjectDetailClient from './client'

export function generateStaticParams() {
  // Pre-render a shell page for the [id] segment.
  // The actual project ID is read client-side via useParams().
  return [{ id: 'index' }]
}

export default function ProjectPage() {
  return <ProjectDetailClient />
}
