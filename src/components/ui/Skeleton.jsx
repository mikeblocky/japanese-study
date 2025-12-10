import { cn } from '@/lib/utils';

/**
 * Skeleton loading component with liquid glass shimmer effect.
 * Use for loading states to improve perceived performance.
 */
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-gradient-to-r from-white/40 via-white/60 to-white/40",
                "before:absolute before:inset-0",
                "before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
                "before:animate-[shimmer_1.5s_infinite]",
                "before:-translate-x-full",
                className
            )}
            {...props}
        />
    );
}

/**
 * Card skeleton for dashboard stats
 */
export function CardSkeleton() {
    return (
        <div className="p-8 rounded-[2rem] glass-panel border border-white/10">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
        </div>
    );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/5">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

/**
 * Page loading skeleton
 */
export function PageSkeleton() {
    return (
        <div className="pb-20 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
                {/* Header skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-6 w-96" />
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                {/* Section skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="space-y-3">
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Skeleton;


