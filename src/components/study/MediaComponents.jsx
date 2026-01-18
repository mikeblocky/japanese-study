import { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Simple audio player component with play button similar to Anki.
 * Supports multiple audio files (comma-separated URLs).
 */
export function AudioPlayer({ src, className }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    if (!src) return null;

    // Handle multiple audio files (comma-separated)
    const audioUrls = src.split(',').map(url => url.trim()).filter(Boolean);
    if (audioUrls.length === 0) return null;

    const handlePlay = async (url) => {
        try {
            // Stop any currently playing audio
            if (audioRef.current) {
                audioRef.current.pause();
            }

            // Create new audio element for this URL
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);

            setIsPlaying(true);
            await audio.play();
        } catch (error) {
            console.error('Failed to play audio:', error);
            setIsPlaying(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {audioUrls.map((url, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(url);
                    }}
                    className={cn(
                        "inline-flex items-center justify-center",
                        "h-8 w-8 rounded-full",
                        "border border-border bg-background",
                        "hover:bg-primary/10 hover:border-primary/50",
                        "transition-colors duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20"
                    )}
                    title={`Play audio ${audioUrls.length > 1 ? index + 1 : ''}`}
                >
                    <Play className="h-3.5 w-3.5 fill-current" />
                </button>
            ))}
        </div>
    );
}

/**
 * Renders an image from a URL, handling Anki media paths.
 * Supports multiple images (comma-separated URLs).
 */
export function MediaImage({ src, alt = "Card image", className }) {
    const [error, setError] = useState(false);

    if (!src || error) return null;

    // Handle multiple images - show first one
    const imageUrls = src.split(',').map(url => url.trim()).filter(Boolean);
    if (imageUrls.length === 0) return null;

    const imageUrl = imageUrls[0];

    return (
        <div className={cn("flex justify-center my-4", className)}>
            <img
                src={imageUrl}
                alt={alt}
                onError={() => setError(true)}
                className="max-w-full max-h-64 rounded-lg object-contain"
            />
        </div>
    );
}

export default AudioPlayer;
