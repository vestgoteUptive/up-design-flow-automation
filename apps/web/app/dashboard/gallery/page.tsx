import { GalleryCard } from '@/components/ui'

export default function GalleryPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text-primary] mb-2">Gallery</h1>
        <p className="font-mono text-[10px] text-[--text-ghost] uppercase tracking-widest">
          View all generated components
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            id: 1,
            name: 'Button',
            author: 'You',
            source: 'figma' as const,
            status: 'REVIEWED' as const,
            date: '2 hours ago',
          },
          {
            id: 2,
            name: 'Card',
            author: 'You',
            source: 'url' as const,
            status: 'BUILDING' as const,
            date: '1 hour ago',
          },
          {
            id: 3,
            name: 'Modal',
            author: 'You',
            source: 'prompt' as const,
            status: 'PUBLISHED' as const,
            date: '30 min ago',
          },
        ].map((item) => (
          <GalleryCard
            key={item.id}
            componentName={item.name}
            authorName={item.author}
            source={item.source}
            status={item.status}
            relativeDate={item.date}
            thumbnailUrl=""
          />
        ))}
      </div>
    </div>
  )
}
