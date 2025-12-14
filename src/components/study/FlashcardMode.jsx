import { cn } from '@/lib/utils';
import Furigana from '@/components/Furigana';
import { Check, X } from 'lucide-react';
import { getTextSize } from './StudyComponents';

/**
 * Flashcard mode for study sessions.
 * Shows term on front, meaning/reading on back.
 */
export default function FlashcardMode({
    displayContent,
    isFlipped,
    onFlip,
    onAnswer,
    feedback,
    showFurigana
}) {
    return (
        <div className="space-y-6">
            <div
                className={cn(
                    "relative min-h-[400px] rounded-2xl p-8 sm:p-12 cursor-pointer border-2 transition-all",
                    feedback === 'correct' && "border-green-500 bg-green-50/50",
                    feedback === 'incorrect' && "border-red-500 bg-red-50/50",
                    !feedback && "border-border hover:border-primary/50 hover:shadow-lg bg-card"
                )}
                onClick={() => !feedback && onFlip()}
            >
                {!isFlipped ? (
                    <div className="h-full flex flex-col items-center justify-center text-center min-h-[350px]">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground mb-8">
                            Term
                        </span>
                        <h2 className={cn("font-bold text-foreground leading-tight", getTextSize(displayContent.term))}>
                            <Furigana
                                text={displayContent.term}
                                reading={displayContent.reading}
                                show={showFurigana}
                            />
                        </h2>
                        <p className="mt-auto text-sm text-muted-foreground">
                            Click or press Space to reveal
                        </p>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center min-h-[350px] space-y-8">
                        <div className="space-y-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Meaning
                            </span>
                            <p className={cn("text-foreground font-semibold", getTextSize(displayContent.english, 'medium'))}>
                                {displayContent.english || '—'}
                            </p>
                        </div>

                        <div className="w-20 h-px bg-border" />

                        <div className="space-y-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Reading
                            </span>
                            <p className={cn("text-foreground", getTextSize(displayContent.reading, 'medium'))}>
                                {displayContent.reading || '—'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isFlipped && !feedback && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                        onClick={() => onAnswer(false)}
                        className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all font-medium"
                    >
                        <X className="w-5 h-5" />
                        Again
                    </button>
                    <button
                        onClick={() => onAnswer(true)}
                        className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/20"
                    >
                        <Check className="w-5 h-5" />
                        Got it
                    </button>
                </div>
            )}
        </div>
    );
}
