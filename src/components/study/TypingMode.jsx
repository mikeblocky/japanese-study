import { cn } from '@/lib/utils';
import Furigana from '@/components/Furigana';
import { getTextSize } from './StudyComponents';

/**
 * Typing mode for study sessions.
 * Shows term and input field for typing the meaning.
 */
export default function TypingMode({
    displayContent,
    typingInput,
    onInputChange,
    onSubmit,
    feedback,
    showFurigana
}) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4 py-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type the meaning
                </span>
                <h2 className={cn("font-bold", getTextSize(displayContent.term))}>
                    <Furigana
                        text={displayContent.term}
                        reading={displayContent.reading}
                        show={showFurigana}
                    />
                </h2>
                {displayContent.reading && (
                    <p className="text-muted-foreground text-lg">{displayContent.reading}</p>
                )}
            </div>

            <form onSubmit={onSubmit} className="max-w-md mx-auto">
                <input
                    autoFocus
                    value={typingInput}
                    onChange={e => onInputChange(e.target.value)}
                    className={cn(
                        "w-full text-center text-2xl sm:text-3xl p-4 sm:p-6 rounded-xl border-2 transition-all",
                        "bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                        feedback === 'correct' && "border-green-500 bg-green-50",
                        feedback === 'incorrect' && "border-red-500 bg-red-50",
                        !feedback && "border-border"
                    )}
                    placeholder="Type here..."
                    disabled={feedback !== null}
                    autoComplete="off"
                    autoCapitalize="off"
                />
            </form>
        </div>
    );
}
