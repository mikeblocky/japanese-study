import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RotateCcw, Keyboard, MousePointer2, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import TestSetup from '@/components/TestSetup';
import { useSettings } from '@/contexts/SettingsContext';

// Extracted components
import { StudyProgress, StudyTimer, StudyStats, getDisplayContent } from '@/components/study/StudyComponents';
import FlashcardMode from '@/components/study/FlashcardMode';
import QuizMode from '@/components/study/QuizMode';
import TypingMode from '@/components/study/TypingMode';

export default function StudySession() {
    const { topicId } = useParams();
    const { settings } = useSettings();

    // Core state
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });


    // Mode state
    const [mode, setMode] = useState('flashcard');
    const [quizOptions, setQuizOptions] = useState([]);
    const [quizDirection, setQuizDirection] = useState('forward');
    const [typingInput, setTypingInput] = useState('');
    const [feedback, setFeedback] = useState(null);

    // Timer state
    const [showTestSetup, setShowTestSetup] = useState(topicId === 'test');
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Fetch items on mount
    useEffect(() => {
        if (topicId === 'test') return;

        setElapsedSeconds(0);
        const fetchUrl = `/topics/${topicId}/items`;

        api.get(fetchUrl)
            .then(res => setItems(res.data.length > 0 ? res.data : []))
            .catch(err => {
                console.error("Fetch error:", err);
                setItems([]);
            });
    }, [topicId]);

    // Quiz options & direction
    useEffect(() => {
        if (mode === 'quiz' && items.length > 0 && items[currentIndex]) {
            setQuizDirection(Math.random() > 0.5 ? 'forward' : 'reverse');
            const current = items[currentIndex];
            const others = items.filter(i => i.id !== current.id);
            const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
            setQuizOptions([...distractors, current].sort(() => 0.5 - Math.random()));
        }
    }, [currentIndex, mode, items]);

    // Timer logic
    useEffect(() => {
        if (timeLeft === null || isFinished) return;
        if (timeLeft <= 0) {
            setIsTimeUp(true);
            setIsFinished(true);
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isFinished]);

    // Elapsed time
    useEffect(() => {
        if (!sessionId || isFinished) return;
        const timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [sessionId, isFinished]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || showTestSetup || feedback) return;

            if (mode === 'quiz' && quizOptions.length > 0 && ['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1;
                if (quizOptions[index]) {
                    handleNext(quizOptions[index].id === items[currentIndex].id);
                }
            }

            if (mode === 'flashcard') {
                if ((e.code === 'Space' || e.code === 'Enter') && !isFlipped) {
                    e.preventDefault();
                    setIsFlipped(true);
                }
                if (isFlipped) {
                    if (e.key === 'ArrowRight' || e.key === '1') handleNext(true);
                    if (e.key === 'ArrowLeft' || e.key === '2') handleNext(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, isFinished, showTestSetup, quizOptions, items, currentIndex, isFlipped, feedback]);

    const handleNext = (correct) => {
        setFeedback(correct ? 'correct' : 'incorrect');

        setTimeout(() => {
            setFeedback(null);
            setTypingInput('');

            if (sessionId && items[currentIndex]) {
                api.post(`/study/session/${sessionId}/submit`, {
                    itemId: items[currentIndex].id,
                    correct
                }).catch(err => console.error("Failed to log item:", err));
            }

            setStats(prev => ({
                correct: correct ? prev.correct + 1 : prev.correct,
                incorrect: !correct ? prev.incorrect + 1 : prev.incorrect
            }));

            if (currentIndex < items.length - 1) {
                setIsFlipped(false);
                setCurrentIndex(prev => prev + 1);
            } else {
                if (sessionId) {
                    api.post(`/study/session/${sessionId}/end`, { durationSeconds: elapsedSeconds })
                        .catch(err => console.error("Failed to end session:", err));
                }
                setIsFinished(true);
            }
        }, 500);
    };

    const handleTypingSubmit = (e) => {
        e.preventDefault();
        const input = typingInput.trim().toLowerCase();
        const correctAnswer = (displayCurrent.english || currentItem.meaning || '').toLowerCase();
        const isCorrect = correctAnswer.includes(input) || input.includes(correctAnswer) || correctAnswer === input;
        handleNext(isCorrect && input.length > 0);
    };

    const handleTestStart = async (config) => {
        try {
            const res = await api.post('/sessions/test/generate', {
                topicIds: config.topicIds || [],
                count: config.count
            });
            setItems(res.data);
            setMode(config.mode);
            if (config.timeLimit > 0) setTimeLeft(config.timeLimit);
            setShowTestSetup(false);

            const sessionRes = await api.post('/study/session/start?userId=1');
            setSessionId(sessionRes.data.id);
        } catch (err) {
            console.error("Failed to start test:", err);
        }
    };

    // Test Setup
    if (showTestSetup) {
        return <TestSetup onStart={handleTestStart} onCancel={() => window.history.back()} />;
    }

    // Loading / Empty
    if (items.length === 0) {
        if (topicId === 'review') {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-5xl">🎉</div>
                    <h2 className="text-2xl font-medium">All caught up!</h2>
                    <p className="text-muted-foreground">No items due for review.</p>
                    <Link to="/" className="mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        Back to Dashboard
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
                {isTimeUp && <p className="text-destructive font-medium">Time's up!</p>}
                <div className="flex gap-4 flex-wrap justify-center">
                    <Link to="/courses" className="px-6 py-2.5 rounded-full border border-border hover:bg-secondary transition-colors text-sm font-medium">
                        Back to Courses
                    </Link>
                    <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
                        Study Again
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const displayCurrent = getDisplayContent(currentItem);
    const progress = (currentIndex / items.length) * 100;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className={cn(
                                "font-mono font-medium",
                                timeLeft !== null && timeLeft < 30 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatTime(timeLeft !== null ? timeLeft : elapsedSeconds)}
                            </span>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-1 p-1 rounded-lg bg-secondary">
                        {[
                            { id: 'flashcard', icon: RotateCcw, label: 'Cards' },
                            { id: 'quiz', icon: MousePointer2, label: 'Quiz' },
                            { id: 'typing', icon: Keyboard, label: 'Type' }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    mode === m.id
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title={m.label}
                            >
                                <m.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <StudyProgress current={currentIndex} total={items.length} />
                </div>

                {/* Main Content - Mode-specific rendering */}
                {mode === 'flashcard' && (
                    <FlashcardMode
                        displayContent={displayCurrent}
                        isFlipped={isFlipped}
                        onFlip={() => setIsFlipped(!isFlipped)}
                        onAnswer={handleNext}
                        feedback={feedback}
                        showFurigana={settings.showFurigana}
                    />
                )}

                {mode === 'quiz' && (
                    <QuizMode
                        displayContent={displayCurrent}
                        quizOptions={quizOptions}
                        quizDirection={quizDirection}
                        onAnswer={handleNext}
                        feedback={feedback}
                        currentItemId={currentItem.id}
                        showFurigana={settings.showFurigana}
                    />
                )}

                {mode === 'typing' && (
                    <TypingMode
                        displayContent={displayCurrent}
                        typingInput={typingInput}
                        onInputChange={setTypingInput}
                        onSubmit={handleTypingSubmit}
                        feedback={feedback}
                        showFurigana={settings.showFurigana}
                    />
                )}
            </div>
        </div>
    );
}
