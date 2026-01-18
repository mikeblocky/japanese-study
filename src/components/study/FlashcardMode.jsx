import { cn } from '@/lib/utils';
import { Check, X, Volume2 } from 'lucide-react';
import { AudioPlayer, MediaImage } from './MediaComponents';
import { useRef, useEffect } from 'react';

// Component to render text with embedded media (from Anki fields)
function RichContent({ text }) {
    if (!text) return null;

    // Extract and render media from text
    const parts = [];
    let remaining = String(text);
    let key = 0;

    // Pattern to find [sound:filename] and <img...src="filename"...>
    const mediaPatterns = [
        { regex: /\[sound:([^\]]+)\]/i, type: 'audio' },
        { regex: /<img[^>]*src=["']?([^"'\s>]+)["']?[^>]*>/i, type: 'image' },
    ];

    while (remaining.length > 0) {
        let earliestMatch = null;
        let earliestIndex = Infinity;
        let matchedPattern = null;

        for (const pattern of mediaPatterns) {
            const match = remaining.match(pattern.regex);
            if (match && match.index < earliestIndex) {
                earliestMatch = match;
                earliestIndex = match.index;
                matchedPattern = pattern;
            }
        }

        if (earliestMatch) {
            // Add text before the match
            if (earliestIndex > 0) {
                const beforeText = remaining.slice(0, earliestIndex).trim();
                if (beforeText) {
                    parts.push(<span key={key++}>{beforeText}</span>);
                }
            }

            // Add the media element
            const filename = earliestMatch[1];
            if (matchedPattern.type === 'audio') {
                parts.push(
                    <span key={key++} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        <Volume2 className="h-3 w-3" />
                        {filename}
                    </span>
                );
            } else if (matchedPattern.type === 'image') {
                parts.push(
                    <span key={key++} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        🖼️ {filename}
                    </span>
                );
            }

            remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
        } else {
            // No more media, add remaining text
            const trimmed = remaining.trim();
            if (trimmed) {
                parts.push(<span key={key++}>{trimmed}</span>);
            }
            break;
        }
    }

    return <>{parts.length > 0 ? parts : text}</>;
}

export default function FlashcardMode({ displayContent, additionalData = {}, isFlipped, onFlip, onAnswer, feedback, audioUrl, imageUrl }) {
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (feedback) return; // Don't handle keys during feedback

            if (!isFlipped) {
                // Space or Enter to flip
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    onFlip();
                }
            } else {
                // Arrow keys to answer
                if (e.code === 'ArrowLeft' || e.code === 'Digit1') {
                    e.preventDefault();
                    onAnswer(false);
                } else if (e.code === 'ArrowRight' || e.code === 'Digit2') {
                    e.preventDefault();
                    onAnswer(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, feedback, onFlip, onAnswer]);

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
            .split(/(?<![^\x00-\x7F])(?=[^\x00-\x7F]+(?:[（(][^)）]+[)）])?[:：])|\n|—(?=[^\s])/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable card content */}
            <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                <div className="max-w-xl mx-auto p-4">
                    <div
                        className={cn(
                            "w-full rounded-2xl bg-card border border-border p-6",
                            !isFlipped && "cursor-pointer",
                            feedback === 'correct' && "border-emerald-500",
                            feedback === 'incorrect' && "border-red-500"
                        )}
                        onClick={() => !isFlipped && !feedback && onFlip()}
                    >
                        {!isFlipped ? (
                            <div className="text-center py-8">
                                <span className="text-xs text-muted-foreground uppercase mb-4 block">Term</span>
                                <h2 className="text-4xl font-bold">{displayContent.term}</h2>
                                <p className="text-sm text-muted-foreground mt-6">Tap or press Space to reveal</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Show Reading first if available and different from term */}
                                {displayContent.reading && displayContent.reading !== displayContent.term && (
                                    <div className="border-b border-border/50 pb-4">
                                        <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">Reading</div>
                                        <div className="text-base leading-relaxed"><RichContent text={displayContent.reading} /></div>
                                    </div>
                                )}
                                {/* Show Meaning only if different from Reading */}
                                {displayContent.english && displayContent.english !== displayContent.reading && (
                                    <div className="border-b border-border/50 pb-4">
                                        <div className="text-xs text-muted-foreground uppercase mb-2 font-medium">Meaning</div>
                                        <div className="text-base leading-relaxed"><RichContent text={displayContent.english} /></div>
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
                                                    <div key={i} className="text-base leading-relaxed">
                                                        <RichContent text={line} />
                                                    </div>
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
                </div>
            </div>

            {/* Sticky bottom bar for answer buttons - inside content area */}
            {isFlipped && !feedback && (
                <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4 -mx-4 mt-4">
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnswer(false); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span className="font-medium">I don't know</span>
                            <kbd className="text-xs bg-red-500/20 px-1.5 py-0.5 rounded">←</kbd>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnswer(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span className="font-medium">I know</span>
                            <kbd className="text-xs bg-white/20 px-1.5 py-0.5 rounded">→</kbd>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
