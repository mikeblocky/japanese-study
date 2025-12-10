import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function StreakBadge({ streak, className }) {
    // Determine fire intensity based on streak length
    const getStreakColor = (days) => {
        if (days === 0) return 'text-muted-foreground';
        if (days < 7) return 'text-orange-500';
        if (days < 30) return 'text-orange-600';
        if (days < 100) return 'text-red-500';
        return 'text-red-600'; // Epic streak!
    };

    const getStreakMessage = (days) => {
        if (days === 0) return 'Start your streak today!';
        if (days === 1) return 'Great start!';
        if (days < 7) return 'Building momentum!';
        if (days < 30) return 'On fire! 🔥';
        if (days < 100) return 'Incredible dedication!';
        return 'LEGENDARY STREAK! 🏆';
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "glass-panel rounded-2xl p-6 flex items-center gap-4 hover:shadow-float transition-shadow",
                className
            )}
        >
            <motion.div
                animate={{
                    scale: streak > 0 ? [1, 1.1, 1] : 1,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="relative"
            >
                <Flame
                    className={cn(
                        "w-12 h-12 transition-colors duration-500",
                        getStreakColor(streak)
                    )}
                />
                {streak > 0 && (
                    <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        {streak > 99 ? '99+' : streak}
                    </motion.div>
                )}
            </motion.div>

            <div className="flex-1">
                <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground/60">
                    Study Streak
                </div>
                <div className="text-4xl font-light tracking-tight mt-1">
                    {streak} {streak === 1 ? 'day' : 'days'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {getStreakMessage(streak)}
                </div>
            </div>
        </motion.div>
    );
}
