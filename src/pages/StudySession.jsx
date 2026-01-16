import api from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgress } from '@/hooks/useProgress';

// Extracted components
import { StudyProgress, StudyStats, getDisplayContent } from '@/components/study/StudyComponents';
import FlashcardMode from '@/components/study/FlashcardMode';

export default function StudySession() {
    const { topicId } = useParams();
    const { recordProgress } = useProgress();

    // Core state
    const [queue, setQueue] = useState([]);
    const [initialCount, setInitialCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    // UI state
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch items on mount
    useEffect(() => {
        const fetchUrl = `/topics/${topicId}/items`;
        setLoading(true);

        api.get(fetchUrl)
            .then(res => {
                let items = res.data.length > 0 ? res.data : [];

                // --- ALGORITHM: SRS Weighted Shuffle ---
                // 1. Sort by SRS Level (ascending - lower/harder first)
                // 2. Add random jitter so it's not strictly deterministic
                items.sort((a, b) => {
                    const levelA = a.userSrsInterval || 0;
                    const levelB = b.userSrsInterval || 0;
                    if (levelA === levelB) return Math.random() - 0.5; // Pure shuffle for same level
                    return levelA - levelB; // Harder (lower level) first
                });

                setQueue(items);
                setInitialCount(items.length);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setQueue([]);
                setLoading(false);
            });
    }, [topicId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || feedback || loading || queue.length === 0) return;

            if ((e.code === 'Space' || e.code === 'Enter') && !isFlipped) {
                e.preventDefault();
                setIsFlipped(true);
            }
            if (isFlipped) {
                if (e.key === 'ArrowRight' || e.key === '1') handleNext(true);
                if (e.key === 'ArrowLeft' || e.key === '2') handleNext(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished, isFlipped, feedback, loading, queue]);

    const handleNext = async (correct) => {
        setFeedback(correct ? 'correct' : 'incorrect');

        const currentItem = queue[0];

        // Record progress to backend (non-blocking)
        // We only record the FIRST attempt result for valid spaced repetition stats
        // If it's a retry (not implemented yet to track "isRetry"), we still send it, backend handles logic.
        // Ideally we track 'hasBeenAttempted' to avoid double-penalizing or double-rewarding in one session.
        if (currentItem?.id) {
            recordProgress(currentItem.id, correct).catch(err => {
                console.warn('Failed to record progress:', err);
            });
        }

        setTimeout(() => {
            setFeedback(null);
            setIsFlipped(false);

            setStats(prev => ({
                correct: correct ? prev.correct + 1 : prev.correct,
                incorrect: !correct ? prev.incorrect + 1 : prev.incorrect
            }));

            // --- ALGORITHM: Retry Logic ---
            const nextQueue = [...queue];
            const processedItem = nextQueue.shift(); // Remove current

            if (correct) {
                // Determine if done
                setCompletedCount(prev => prev + 1);
            } else {
                // Incorrect: Re-queue
                // Insert back into queue, but not immediately (delayed by min(5, len))
                // This SRS style ensures you see it again before session end.
                const insertIndex = Math.min(nextQueue.length, 3 + Math.floor(Math.random() * 3));
                nextQueue.splice(insertIndex, 0, processedItem);
            }

            setQueue(nextQueue);

            if (nextQueue.length === 0) {
                setIsFinished(true);
            }
        }, 500); // Animation delay
    };

    // Loading / Empty
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                Prepare your mind...
            </div>
        );
    }

    if (initialCount === 0 && !loading) {
        if (topicId === 'review') {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-6xl opacity-80">🍃</div>
                    <h2 className="text-3xl font-serif text-primary mb-2">Tranquility.</h2>
                    <p className="text-xl text-muted-foreground font-serif italic">Your reviews are complete for now.</p>
                    <Link to="/" className="mt-6 px-8 py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors font-serif">
                        Return home
                    </Link>
                </div>
            );
        }
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-muted-foreground">This course / topic has no words yet.</div>
                <Link to="/management" className="text-primary hover:underline">Add words in Management</Link>
            </div>
        );
    }

    // Finished
    if (isFinished) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                <StudyStats correct={stats.correct} incorrect={stats.incorrect} total={initialCount} />
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Session Complete!</h2>
                    <p className="text-muted-foreground">You've cleared the queue.</p>
                </div>
                <div className="flex gap-4 flex-wrap justify-center">
                    <Link to="/courses" className="px-6 py-2.5 rounded-full border border-border hover:bg-secondary transition-colors text-sm font-medium">
                        Explore courses
                    </Link>
                    <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
                        Review again
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = queue[0];
    // Safety check
    if (!currentItem) return null;

    const displayCurrent = getDisplayContent(currentItem);

    return (
        <div className="pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between py-4 mb-6 border-b">
                    <Link to="/courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </Link>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                            {/* Dynamic Queue Counter */}
                            <span className="font-medium text-foreground">{initialCount - queue.length + 1}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{initialCount}</span>
                            {queue.length > initialCount - completedCount && (
                                <span className="ml-1 text-xs text-orange-500 font-bold" title="Retry items added">
                                    (+{queue.length - (initialCount - completedCount)})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    {/* Show visual progress based on completed vs initial, capping at 100% just in case of logic drift, though queue logic implies remaining items */}
                    <StudyProgress current={completedCount} total={initialCount} />
                </div>

                {/* Main Content - Always Flashcard */}
                <FlashcardMode
                    displayContent={displayCurrent}
                    additionalData={displayCurrent.additionalData || currentItem.additionalData}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                    onAnswer={handleNext}
                    feedback={feedback}
                    showFurigana={true}
                />

                {/* Debug Info (Optional - remove in prod if desired, keeping for user clarity on 'shuffle') */}
                <div className="text-center mt-4 opacity-30 text-xs">
                    SRS Level: {currentItem.userSrsInterval || 0} • Queue: {queue.length}
                </div>
            </div>
        </div>
    );
}
