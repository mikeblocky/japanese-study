import { cn } from '@/lib/utils';

// Component to render text content (no media support)
function RichContent({ text }) {
    if (!text) return null;
    return <>{String(text)}</>;
}

export default function FlashcardMode({ displayContent, additionalData = {}, isFlipped, onFlip, onAnswer, feedback }) {
    const feedbackStyles = {
        again: "border-red-400/70 shadow-[0_10px_40px_-20px_rgba(248,113,113,0.6)]",
        hard: "border-amber-300/70 shadow-[0_10px_40px_-20px_rgba(251,191,36,0.5)]",
        good: "border-emerald-400/70 shadow-[0_10px_40px_-20px_rgba(16,185,129,0.6)]",
        easy: "border-sky-400/70 shadow-[0_10px_40px_-20px_rgba(56,189,248,0.55)]"
    };

    const ratingOptions = [
        { key: 'again', label: 'Again', hint: '1', classes: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' },
        { key: 'hard', label: 'Hard', hint: '2', classes: 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' },
        { key: 'good', label: 'Good', hint: '3', classes: 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
        { key: 'easy', label: 'Easy', hint: '4', classes: 'border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100' }
    ];

    // Collect values already shown (reading and meaning)
    const shownValues = new Set();
    if (displayContent.reading) shownValues.add(displayContent.reading.trim().toLowerCase());
    if (displayContent.english) shownValues.add(displayContent.english.trim().toLowerCase());
    if (displayContent.term) shownValues.add(displayContent.term.trim().toLowerCase());

    // Filter out fields that have values already displayed
    const allFields = Object.entries(additionalData || {}).filter(([key, value]) => {
        if (!value || String(value).trim() === '') return false;
        const normalizedValue = String(value).trim().toLowerCase();
        return !shownValues.has(normalizedValue);
    });

    const formatContent = (text) => {
        if (!text) return [];
        return String(text)
            .split(/\n|—(?=[^\s])/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div
                        className={cn(
                            "relative w-full rounded-3xl bg-card border border-border/60 p-6 shadow-sm",
                            !isFlipped && "cursor-pointer",
                            feedback && feedbackStyles[feedback]
                        )}
                        onClick={() => !isFlipped && !feedback && onFlip()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Term</span>
                                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">{displayContent.term}</h2>
                            </div>
                        </div>

                        {!isFlipped ? (
                            <p className="mt-6 text-sm text-muted-foreground">Tap or press Space to reveal</p>
                        ) : (
                            <div className="mt-8 space-y-5">
                                {displayContent.reading && displayContent.reading !== displayContent.term && (
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full">Reading</span>
                                        <div className="text-lg leading-relaxed"><RichContent text={displayContent.reading} /></div>
                                    </div>
                                )}

                                {displayContent.english && displayContent.english !== displayContent.reading && (
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full">Meaning</span>
                                        <div className="text-lg leading-relaxed"><RichContent text={displayContent.english} /></div>
                                    </div>
                                )}

                                {allFields.length > 0 && (
                                    <div className="space-y-3">
                                        {allFields.map(([key, value]) => {
                                            const lines = formatContent(value);
                                            return (
                                                <div key={key} className="space-y-1">
                                                    <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/20 px-2 py-1 rounded-full">{key}</span>
                                                    <div className="space-y-1.5">
                                                        {lines.map((line, i) => (
                                                            <div key={i} className="text-base leading-relaxed">
                                                                <RichContent text={line} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {allFields.length === 0 && !displayContent.reading && !displayContent.english && (
                                    <div className="text-sm text-muted-foreground">No content on this card.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFlipped && !feedback && (
                <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {ratingOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={(e) => { e.stopPropagation(); onAnswer(option.key); }}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors text-sm font-semibold",
                                    option.classes
                                )}
                            >
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-white/70 border border-current">
                                    {option.hint}
                                </span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
