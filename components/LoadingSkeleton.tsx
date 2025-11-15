/**
 * Loading Skeleton Components
 * Provides smooth loading states for better perceived performance
 */

export function ChatSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-32 bg-background-raised rounded-2xl" />
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-background-raised rounded-xl" />
        <div className="h-10 w-24 bg-background-raised rounded-xl" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-background-raised rounded-2xl animate-pulse space-y-4">
      <div className="h-6 bg-background-sunken rounded w-3/4" />
      <div className="h-4 bg-background-sunken rounded w-full" />
      <div className="h-4 bg-background-sunken rounded w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-10 w-20 bg-background-sunken rounded-xl" />
        <div className="h-10 w-20 bg-background-sunken rounded-xl" />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-background-raised rounded-xl animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="h-16 bg-background-raised border-b border-light animate-pulse">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background-sunken rounded-xl" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-background-sunken rounded" />
            <div className="h-3 w-16 bg-background-sunken rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-24 h-10 bg-background-sunken rounded-xl" />
          <div className="w-10 h-10 bg-background-sunken rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-6 bg-background-raised rounded-2xl border border-light animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-background-sunken rounded w-2/3" />
          <div className="h-4 bg-background-sunken rounded w-1/2" />
        </div>
        <div className="w-16 h-6 bg-background-sunken rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-background-sunken rounded w-full" />
        <div className="h-3 bg-background-sunken rounded w-4/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-background-sunken rounded-lg" />
        <div className="h-8 w-16 bg-background-sunken rounded-lg" />
        <div className="h-8 w-16 bg-background-sunken rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full border border-light rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-background-subtle border-b border-light p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-background-sunken rounded flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4 border-b border-subtle last:border-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-background-raised rounded flex-1 animate-pulse"
              style={{ animationDelay: `${(rowIndex * cols + colIndex) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background-base">
      <HeaderSkeleton />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
          <ListSkeleton items={3} />
        </div>
      </div>
    </div>
  );
}

export default {
  Chat: ChatSkeleton,
  Card: CardSkeleton,
  List: ListSkeleton,
  Header: HeaderSkeleton,
  ProjectCard: ProjectCardSkeleton,
  Table: TableSkeleton,
  FullPage: FullPageSkeleton,
};
