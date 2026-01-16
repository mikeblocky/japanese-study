import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export default function FlashcardMode({ displayContent, additionalData = {}, isFlipped, onFlip, onAnswer, feedback }) {
    const allFields = Object.entries(additionalData || {}).filter(([key, value]) =>
        value && String(value).trim() !== ''
    );

    const formatContent = (text) => {
        if (!text) return [];
        // Split by em-dash followed by Japanese character, or by existing newlines
        return String(text)
            .split(/(?=一|二|三|四|五|六|七|八|九|十)|—(?=[^\s])|\n/)
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
                        {allFields.length === 0 && (
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
