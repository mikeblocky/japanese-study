import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Consistent page layout wrapper for all main pages.
 * Provides standard padding, max-width, and animations.
 */
export default function PageLayout({
    children,
    title,
    subtitle,
    maxWidth = "max-w-6xl",
    className
}) {
    return (
        <div className={cn("pb-20 animate-in fade-in duration-500", className)}>
            <div className={cn("mx-auto px-4 md:px-6", maxWidth)}>
                {/* Header */}
                {(title || subtitle) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 mb-12"
                    >
                        {title && (
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-lg md:text-xl text-muted-foreground/80 font-light max-w-xl">
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Content */}
                <div className="space-y-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
