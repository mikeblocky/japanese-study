import { cn } from '@/lib/utils';
import { Check, X, Volume2, Play, Image as ImageIcon, Image, AudioLines } from 'lucide-react';
import { AudioPlayer, MediaImage } from './MediaComponents';
import { useRef, useEffect, useState, useMemo } from 'react';
import { API_URL } from '@/lib/api';

// Normalize media URLs so they always point to the backend host (important in prod when
// the frontend is on a different domain). Keeps existing relative `/api/media/...` values working.
const API_ORIGIN = (() => {
    try {
        return new URL(API_URL).origin;
    } catch (err) {
        console.warn('Unable to resolve API origin for media URLs:', err);
        return '';
    }
})();

const normalizeMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!API_ORIGIN) return url;
    return url.startsWith('/') ? `${API_ORIGIN}${url}` : `${API_ORIGIN}/${url}`;
};

const normalizeCsvUrls = (csv) => {
    if (!csv) return '';
    return csv
        .split(',')
        .map(part => normalizeMediaUrl(part.trim()))
        .filter(Boolean)
        .join(',');
};

// Mini audio player for inline audio references
function InlineAudioPlayer({ filename, storedUrl }) {
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState(false);
    const audioRef = useRef(null);

    // Use storedUrl if available, otherwise try the direct filename path
    const audioSrc = normalizeMediaUrl(storedUrl || `/api/media/${filename}`);

    const handlePlay = () => {
        if (audioRef.current) {
            if (playing) {
                audioRef.current.pause();
                setPlaying(false);
            } else {
                audioRef.current.play().catch(() => setError(true));
                setPlaying(true);
            }
        }
    };

    return (
        <span className="inline-flex items-center gap-1">
            <button
                onClick={handlePlay}
                disabled={error}
                className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                    error
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : playing
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/50"
                )}
            >
                {playing ? <Volume2 className="h-3 w-3 animate-pulse" /> : <Play className="h-3 w-3" />}
                <span className="max-w-32 truncate">{filename}</span>
            </button>
            <audio
                ref={audioRef}
                src={audioSrc}
                onEnded={() => setPlaying(false)}
                onError={() => setError(true)}
                className="hidden"
            />
        </span>
    );
}

// Inline image component with error handling
function InlineImage({ filename, storedUrl }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Use storedUrl if available, otherwise try the direct filename path
    const imageSrc = normalizeMediaUrl(storedUrl || `/api/media/${filename}`);

    if (error) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                <span className="max-w-32 truncate">{filename}</span>
            </span>
        );
    }

    return (
        <span className="inline-block my-2">
            <img
                src={imageSrc}
                alt={filename}
                onError={() => setError(true)}
                onLoad={() => setLoaded(true)}
                className={cn(
                    "max-w-full max-h-48 rounded-lg border border-border object-contain",
                    !loaded && "hidden"
                )}
            />
            {!loaded && !error && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    <ImageIcon className="h-3 w-3 animate-pulse" />
                    Loading...
                </span>
            )}
        </span>
    );
}
// Component to render text with embedded media (from Anki fields)
// mediaUrlMap: { originalFilename: storedUrl } - maps original filenames to stored API URLs
function RichContent({ text, mediaUrlMap = {} }) {
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

            // Add the media element with stored URL if available
            const filename = earliestMatch[1];
            const storedUrl = mediaUrlMap[filename];

            if (matchedPattern.type === 'audio') {
                parts.push(<InlineAudioPlayer key={key++} filename={filename} storedUrl={storedUrl} />);
            } else if (matchedPattern.type === 'image') {
                parts.push(<InlineImage key={key++} filename={filename} storedUrl={storedUrl} />);
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

    // Build media URL map from stored audio/image URLs
    // The audioUrl/imageUrl contain stored paths like "/api/media/abc123_filename.mp3"
    // We need to map "filename.mp3" -> "/api/media/abc123_filename.mp3"
    const normalizedAudioUrl = useMemo(() => normalizeCsvUrls(audioUrl), [audioUrl]);
    const normalizedImageUrl = useMemo(() => normalizeCsvUrls(imageUrl), [imageUrl]);

    const mediaUrlMap = useMemo(() => {
        const map = {};

        const addMappings = (value) => {
            if (!value) return;
            value.split(',').forEach(url => {
                const normalizedUrl = normalizeMediaUrl(url.trim());
                const match = normalizedUrl.match(/\/api\/media\/[^_]+_(.+)$/);
                if (match) {
                    map[match[1]] = normalizedUrl;
                }
            });
        };

        addMappings(audioUrl);
        addMappings(imageUrl);

        return map;
    }, [audioUrl, imageUrl]);

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
                            feedback === 'correct' && "border-emerald-400/70 shadow-[0_10px_40px_-20px_rgba(16,185,129,0.6)]",
                            feedback === 'incorrect' && "border-red-400/70 shadow-[0_10px_40px_-20px_rgba(248,113,113,0.6)]"
                        )}
                        onClick={() => !isFlipped && !feedback && onFlip()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Term</span>
                                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">{displayContent.term}</h2>
                            </div>
                            {(normalizedAudioUrl || normalizedImageUrl) && (
                                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                                    {normalizedAudioUrl && <AudioLines className="h-4 w-4" />}
                                    {normalizedImageUrl && <Image className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Media</span>
                                </div>
                            )}
                        </div>

                        {!isFlipped ? (
                            <p className="mt-6 text-sm text-muted-foreground">Tap or press Space to reveal</p>
                        ) : (
                            <div className="mt-8 space-y-5">
                                {displayContent.reading && displayContent.reading !== displayContent.term && (
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full">Reading</span>
                                        <div className="text-lg leading-relaxed"><RichContent text={displayContent.reading} mediaUrlMap={mediaUrlMap} /></div>
                                    </div>
                                )}

                                {displayContent.english && displayContent.english !== displayContent.reading && (
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full">Meaning</span>
                                        <div className="text-lg leading-relaxed"><RichContent text={displayContent.english} mediaUrlMap={mediaUrlMap} /></div>
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
                                                                <RichContent text={line} mediaUrlMap={mediaUrlMap} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {(normalizedAudioUrl || normalizedImageUrl) && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {normalizedAudioUrl && (
                                            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                                                <Volume2 className="h-4 w-4 text-muted-foreground" />
                                                <AudioPlayer src={normalizedAudioUrl} />
                                            </div>
                                        )}
                                        {normalizedImageUrl && (
                                            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                                                <MediaImage src={normalizedImageUrl} alt={displayContent.term} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {allFields.length === 0 && !displayContent.reading && !displayContent.english && !normalizedAudioUrl && !normalizedImageUrl && (
                                    <div className="text-sm text-muted-foreground">No content on this card.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFlipped && !feedback && (
                <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnswer(false); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span className="font-medium">Again</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnswer(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span className="font-medium">Got it</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
