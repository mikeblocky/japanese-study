import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';

/**
 * Animated progress bar for metrics display.
 */
export function ProgressBar({ value, max, color = "from-purple-500 to-violet-500" }) {
    const animationsEnabled = useAnimationsEnabled();

    const safeMax = typeof max === 'number' && max > 0 ? max : 1;
    const safeValue = typeof value === 'number' && value > 0 ? value : 0;
    const widthPct = `${Math.min((safeValue / safeMax) * 100, 100)}%`;

    return (
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            {animationsEnabled ? (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: widthPct }}
                    className={cn("h-full bg-gradient-to-r rounded-full", color)}
                />
            ) : (
                <div
                    className={cn("h-full bg-gradient-to-r rounded-full", color)}
                    style={{ width: widthPct }}
                />
            )}
        </div>
    );
}

/**
 * Metric card component for displaying stats with icon.
 */
export function MetricCard({ icon: Icon, title, value, unit, color, subValue }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                <Icon className={cn("w-3.5 h-3.5", color)} />
                {title}
            </div>
            <div className="text-2xl font-light">
                {value ?? '—'}
                {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </div>
            {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
        </div>
    );
}
