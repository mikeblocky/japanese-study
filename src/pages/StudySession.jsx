import api from '@/lib/api';
import { useState, useEffect } from 'react';
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
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const [feedback, setFeedback] = useState(null);

    // Fetch items on mount
    useEffect(() => {
        const fetchUrl = `/topics/${topicId}/items`;

        api.get(fetchUrl)
            .then(res => setItems(res.data.length > 0 ? res.data : []))
            .catch(err => {
                console.error("Fetch error:", err);
                setItems([]);
            });
    }, [topicId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || feedback) return;

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
    }, [isFinished, isFlipped, feedback]);

    const handleNext = async (correct) => {
        setFeedback(correct ? 'correct' : 'incorrect');

        // Record progress to backend (non-blocking)
        const currentItem = items[currentIndex];
        if (currentItem?.id) {
            recordProgress(currentItem.id, correct).catch(err => {
                console.warn('Failed to record progress:', err);
            });
        }

        setTimeout(() => {
            setFeedback(null);

            setStats(prev => ({
                correct: correct ? prev.correct + 1 : prev.correct,
                incorrect: !correct ? prev.incorrect + 1 : prev.incorrect
            }));

            if (currentIndex < items.length - 1) {
                setIsFlipped(false);
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsFinished(true);
            }
        }, 500);
    };

    // Loading / Empty
    if (items.length === 0) {
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
            <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                Loading...
            </div>
        );
    }

    // Finished
    if (isFinished) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                <StudyStats correct={stats.correct} incorrect={stats.incorrect} total={items.length} />
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

    const currentItem = items[currentIndex];
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
                            <span className="font-medium text-foreground">{currentIndex + 1}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{items.length}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <StudyProgress current={currentIndex} total={items.length} />
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
            </div>
        </div>
    );
}
