import api from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Swords, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgress } from '@/hooks/useProgress';

// Extracted components
import { StudyProgress, StudyStats, getDisplayContent } from '@/components/study/StudyComponents';
import FlashcardMode from '@/components/study/FlashcardMode';
import { Button } from '@/components/ui/button';

export default function StudySession() {
    const { topicId } = useParams();
    const { recordProgress } = useProgress();
    const isChallenge = topicId === 'challenge';

    // Core state
    const [queue, setQueue] = useState([]);
    const [initialCount, setInitialCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    // History Tracking for Report Card
    // Format: { item, correct, oldInterval, newInterval }
    const [sessionHistory, setSessionHistory] = useState([]);

    // UI state
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch items on mount
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                let items = [];
                if (isChallenge) {
                    const res = await api.get('/progress/challenge?limit=20');
                    // Transform ProgressResponse to StudyItem-like shape if needed
                    // Backend returns ProgressResponse which contains item fields
                    items = res.data.map(p => ({
                        id: p.studyItemId,
                        primaryText: p.primaryText,
                        secondaryText: p.secondaryText,
                        meaning: p.meaning,
                        userSrsInterval: p.interval, // Current interval
                        // Populate additionalData so FlashcardMode displays them on the back
                        additionalData: {
                            "Reading": p.secondaryText,
                            "Meaning": p.meaning
                        }
                    }));
                } else {
                    const res = await api.get(`/topics/${topicId}/items`);
                    items = res.data;
                }

                if (items.length > 0) {
                    // --- ALGORITHM: SRS Weighted Shuffle (Skip for Challenge as backend shuffles) ---
                    if (!isChallenge) {
                        items.sort((a, b) => {
                            const levelA = a.userSrsInterval || 0;
                            const levelB = b.userSrsInterval || 0;
                            if (levelA === levelB) return Math.random() - 0.5;
                            return levelA - levelB;
                        });
                    }
                }

                setQueue(items);
                setInitialCount(items.length);
            } catch (err) {
                console.error("Fetch error:", err);
                setQueue([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [topicId, isChallenge]);

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

        let newInterval = currentItem.userSrsInterval;

        // Record progress
        if (currentItem?.id) {
            try {
                // Pass harshMode = isChallenge
                const result = await recordProgress(currentItem.id, correct, isChallenge);
                newInterval = result.interval;

                // Track for Report Card (Only first attempt counts for history)
                // We check if this item ID is already in history to avoid dups from retries
                setSessionHistory(prev => {
                    if (prev.find(h => h.item.id === currentItem.id)) return prev;
                    return [...prev, {
                        item: currentItem,
                        correct,
                        oldInterval: currentItem.userSrsInterval || 0,
                        newInterval: result.interval
                    }];
                });

            } catch (err) {
                console.warn('Failed to record progress:', err);
            }
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
            const processedItem = nextQueue.shift();

            if (correct) {
                setCompletedCount(prev => prev + 1);
            } else {
                // Re-queue logic
                const insertIndex = Math.min(nextQueue.length, 3 + Math.floor(Math.random() * 3));
                nextQueue.splice(insertIndex, 0, processedItem);
            }

            setQueue(nextQueue);

            if (nextQueue.length === 0) {
                setIsFinished(true);
            }
        }, 500);
    };

    // Loading
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="font-serif italic animate-pulse">Summoning words...</p>
            </div>
        );
    }

    // Empty State
    if (initialCount === 0 && !loading) {
        if (isChallenge) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                    <Trophy className="w-16 h-16 text-yellow-500 opacity-50 mb-2" />
                    <h2 className="text-2xl font-bold">Arena Empty</h2>
                    <p className="text-muted-foreground">You haven't studied any cards yet!</p>
                    <Button asChild className="mt-4 rounded-full">
                        <Link to="/courses">Go Study</Link>
                    </Button>
                </div>
            );
        }
        // ... existing empty states ...
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-muted-foreground">This course / topic has no words yet.</div>
                <Link to="/management" className="text-primary hover:underline">Add words in Management</Link>
            </div>
        );
    }

    // Finished - Report Card View
    if (isFinished) {
        return (
            <div className="max-w-3xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold font-serif mb-2 flex items-center justify-center gap-3">
                        {isChallenge ? <Swords className="h-8 w-8 text-red-500" /> : <Trophy className="h-8 w-8 text-yellow-500" />}
                        {isChallenge ? "Arena Conquered" : "Session Complete"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isChallenge ? "You survived the harsh trials." : "Knowledge secured."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-green-600/70">Correct</div>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-red-600/70">Incorrect</div>
                    </div>
                </div>

                {/* Detailed Report Card */}
                <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b bg-muted/40 font-medium text-sm flex justify-between items-center">
                        <span>Battle Log</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">SRS Delta</span>
                    </div>
                    <div className="divide-y">
                        {sessionHistory.map((record, idx) => {
                            const delta = record.newInterval - record.oldInterval;
                            const isLoss = delta < 0;
                            const isGain = delta > 0;

                            return (
                                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                record.correct ? "bg-green-500" : "bg-red-500"
                                            )} />
                                            <div className="font-medium truncate text-base">
                                                {record.item.primaryText}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground pl-5 truncate">
                                            {record.item.secondaryText}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 font-mono text-sm">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-muted-foreground line-through opacity-50">
                                                Lv.{record.oldInterval}
                                            </span>
                                            <span className="font-bold">
                                                Lv.{record.newInterval}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "w-12 text-right font-bold",
                                            isLoss ? "text-red-500" : (isGain ? "text-green-500" : "text-muted-foreground")
                                        )}>
                                            {isLoss ? '↓' : (isGain ? '↑' : '=')}
                                            {Math.abs(delta)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4 flex-wrap justify-center mt-10">
                    <Link to="/courses" className="px-8 py-3 rounded-full border border-border hover:bg-secondary transition-colors font-medium">
                        Return
                    </Link>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 font-medium">
                        Again
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = queue[0];
    if (!currentItem) return null;

    const displayCurrent = getDisplayContent(currentItem);

    return (
        <div className="pb-20">
            {/* Top Bar - Challenge Variant */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between py-4 mb-6 border-b">
                    <Link to="/courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Escape</span>
                    </Link>

                    {isChallenge && (
                        <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                            <Swords className="h-4 w-4" />
                            <span className="text-xs uppercase tracking-widest">Random Challenge</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 font-mono text-sm">
                        {initialCount - queue.length + 1} / {initialCount}
                        {queue.length > initialCount - completedCount && (
                            <span className="ml-1 text-xs text-orange-500 font-bold">(+{queue.length - (initialCount - completedCount)})</span>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <StudyProgress current={completedCount} total={initialCount} isChallenge={isChallenge} />
                </div>

                <FlashcardMode
                    displayContent={displayCurrent}
                    additionalData={displayCurrent.additionalData || currentItem.additionalData}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                    onAnswer={handleNext}
                    feedback={feedback}
                    audioUrl={currentItem.audioUrl}
                    imageUrl={currentItem.imageUrl}
                />
            </div>
        </div>
    );
}
