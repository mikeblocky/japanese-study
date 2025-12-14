import { cn } from '@/lib/utils';

/**
 * Progress bar showing current position in study session.
 */
export function StudyProgress({ current, total }) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

/**
 * Timer display for study sessions.
 */
export function StudyTimer({ seconds, isCountdown = false, className }) {
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <span className={cn("font-mono font-medium", className)}>
            {formatTime(seconds)}
        </span>
    );
}

/**
 * Study session statistics display.
 */
export function StudyStats({ correct, incorrect, total }) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
        <div className="text-center space-y-4">
            <div className="text-6xl">{accuracy >= 80 ? '🎊' : accuracy >= 50 ? '👍' : '💪'}</div>
            <h2 className="text-3xl font-medium">Session Complete</h2>
            <div className="text-7xl font-bold tracking-tight">
                {accuracy}<span className="text-3xl text-muted-foreground">%</span>
            </div>
            <p className="text-muted-foreground">
                {correct} correct · {incorrect} incorrect
            </p>
        </div>
    );
}

/**
 * Dynamic font sizing based on text length.
 */
export function getTextSize(text, base = 'large') {
    if (!text) return base === 'large' ? 'text-5xl' : 'text-3xl';
    const len = text.length;
    if (base === 'large') {
        if (len > 30) return 'text-2xl md:text-3xl';
        if (len > 15) return 'text-3xl md:text-4xl';
        if (len > 8) return 'text-4xl md:text-5xl';
        return 'text-5xl md:text-7xl';
    }
    if (len > 40) return 'text-lg md:text-xl';
    if (len > 20) return 'text-xl md:text-2xl';
    return 'text-2xl md:text-3xl';
}

/**
 * Helper to detect Japanese/non-ASCII characters.
 */
export function isJapanese(text) {
    return /[^\x00-\x7F]/.test(text || '');
}

/**
 * Smart content derivation to handle swapped fields from Anki import.
 */
export function getDisplayContent(item) {
    const meaningHasJp = isJapanese(item.meaning);
    const secondaryHasJp = isJapanese(item.secondaryText);

    let englishText = item.meaning;
    let readingText = item.secondaryText;

    // If meaning contains Japanese and secondary doesn't, they're swapped
    if (meaningHasJp && !secondaryHasJp && item.secondaryText) {
        englishText = item.secondaryText;
        readingText = item.meaning;
    }

    return {
        term: item.primaryText,
        english: englishText,
        reading: readingText
    };
}
