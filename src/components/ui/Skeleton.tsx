import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-loading",
        variant === 'circle' && "rounded-full",
        variant === 'text' && "h-4 w-full rounded-sm mb-2",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border border-border bg-panel/30 rounded-sm space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-border/50 bg-panel/20 rounded-sm">
          <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/4 h-3" />
            <Skeleton variant="text" className="w-3/4 h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
