import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { AudioPlayer, MediaImage } from './MediaComponents';

export default function FlashcardMode({ displayContent, additionalData = {}, isFlipped, onFlip, onAnswer, feedback, audioUrl, imageUrl }) {
    // Collect values already shown (reading and meaning)
    const shownValues = new Set();
    if (displayContent.reading) shownValues.add(displayContent.reading.trim().toLowerCase());
    if (displayContent.english) shownValues.add(displayContent.english.trim().toLowerCase());
    if (displayContent.term) shownValues.add(displayContent.term.trim().toLowerCase());

    // Filter out fields that have values already displayed
    const allFields = Object.entries(additionalData || {}).filter(([key, value]) => {
        if (!value || String(value).trim() === '') return false;
        const normalizedValue = String(value).trim().toLowerCase();
        // Skip if this value is already shown
        return !shownValues.has(normalizedValue);
    });

    const formatContent = (text) => {
        if (!text) return [];
        return String(text)
            .split(/(?<![^\x00-\x7F])(?=[^\x00-\x7F]+(?:[（(][^)）]+[)）])?[:：])|\n|—(?=[^\s])/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    return (
        <div className="space-y-6 max-w-xl mx-auto pb-10">
            <div
                className={cn(
                    "w-full rounded-2xl bg-card border border-border p-6 cursor-pointer",
                    feedback === 'correct' && "border-emerald-500",
                    feedback === 'incorrect' && "border-red-500"
                )}
                onClick={() => !feedback && onFlip()}
            >
                {!isFlipped ? (
                    <div className="text-center py-8">
                        <span className="text-xs text-muted-foreground uppercase mb-4 block">Term</span>
                        <h2 className="text-4xl font-bold">{displayContent.term}</h2>
                        <p className="text-sm text-muted-foreground mt-6">Tap to reveal</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Show Reading first if available and different from term */}
                        {displayContent.reading && displayContent.reading !== displayContent.term && (
                            <div className="border-b border-border/50 pb-4">
                                <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">Reading</div>
                                <div className="text-base leading-relaxed">{displayContent.reading}</div>
                            </div>
                        )}
                        {/* Show Meaning only if different from Reading */}
                        {displayContent.english && displayContent.english !== displayContent.reading && (
                            <div className="border-b border-border/50 pb-4">
                                <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">Meaning</div>
                                <div className="text-base leading-relaxed">{displayContent.english}</div>
                            </div>
                        )}
                        {/* Show additional fields (non-duplicate values only) */}
                        {allFields.map(([key, value]) => {
                            const lines = formatContent(value);
                            return (
                                <div key={key} className="border-b border-border/50 pb-4 last:border-0">
                                    <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">{key}</div>
                                    <div className="space-y-2">
                                        {lines.map((line, i) => (
                                            <div key={i} className="text-base leading-relaxed">{line}</div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Audio player - show if there's audio */}
                        {audioUrl && (
                            <div className="flex justify-center pt-2">
                                <AudioPlayer src={audioUrl} />
                            </div>
                        )}

                        {/* Image display - show if there's an image */}
                        {imageUrl && (
                            <MediaImage src={imageUrl} alt={displayContent.term} />
                        )}

                        {allFields.length === 0 && !displayContent.reading && !displayContent.english && !audioUrl && !imageUrl && (
                            <div className="text-center py-4 text-muted-foreground">No data</div>
                        )}
                    </div>
                )}
            </div>

            {isFlipped && !feedback && (
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => onAnswer(false)}
                        className="h-12 w-12 rounded-full border-2 border-red-200 text-red-500 flex items-center justify-center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onAnswer(true)}
                        className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

