import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X, RotateCcw, Keyboard, MousePointer2, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import TestSetup from '@/components/TestSetup';
import Furigana from '@/components/Furigana';
import { useSettings } from '@/contexts/SettingsContext';

export default function StudySession() {
    const { topicId } = useParams();
    const { settings } = useSettings();
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const [sessionId, setSessionId] = useState(null);

    const [mode, setMode] = useState('flashcard');
    const [quizOptions, setQuizOptions] = useState([]);
    const [typingInput, setTypingInput] = useState('');
    const [feedback, setFeedback] = useState(null);

    const [showTestSetup, setShowTestSetup] = useState(topicId === 'test');
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Fetch items on mount
    useEffect(() => {
        if (topicId === 'test') return;

        setElapsedSeconds(0);
        api.post('/study/session/start')
            .then(res => setSessionId(res.data.id))
            .catch(err => console.error("Failed to start session:", err));

        const fetchUrl = topicId === 'review'
            ? '/study/items/due'
            : topicId === 'daily'
                ? '/study/items/due'
                : `/study/items/topic/${topicId}`;

        api.get(fetchUrl)
            .then(res => {
                const data = res.data;
                if (data.length > 0) setItems(data);
                else setItems([]);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setItems([]);
            });
    }, [topicId]);

    const [quizDirection, setQuizDirection] = useState('forward');

    // Quiz options & Direction
    useEffect(() => {
        if (mode === 'quiz' && items.length > 0 && items[currentIndex]) {
            // Randomize direction for each card (50/50 mix)
            setQuizDirection(Math.random() > 0.5 ? 'forward' : 'reverse');

            const current = items[currentIndex];
            const others = items.filter(i => i.id !== current.id);
            const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [...distractors, current].sort(() => 0.5 - Math.random());
            setQuizOptions(options);
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
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || showTestSetup || feedback) return;

            if (mode === 'quiz' && quizOptions.length > 0) {
                if (['1', '2', '3', '4'].includes(e.key)) {
                    const index = parseInt(e.key) - 1;
                    if (quizOptions[index]) {
                        handleNext(quizOptions[index].id === items[currentIndex].id);
                    }
                }
            }

            if (mode === 'flashcard') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    if (!isFlipped) {
                        setIsFlipped(true);
                    }
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
        // Check against the actual reading field (secondaryText or primaryText reading)
        const correctAnswer = (currentItem.secondaryText || currentItem.reading || '').toLowerCase();
        const matchReading = correctAnswer === input;
        handleNext(matchReading);
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

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Dynamic font sizing based on text length
    const getTextSize = (text, base = 'large') => {
        if (!text) return base === 'large' ? 'text-5xl' : 'text-3xl';
        const len = text.length;
        if (base === 'large') {
            if (len > 30) return 'text-2xl md:text-3xl';
            if (len > 15) return 'text-3xl md:text-4xl';
            if (len > 8) return 'text-4xl md:text-5xl';
            return 'text-5xl md:text-7xl';
        }
        if (len > 40) return 'text-lg md:text-xl';
        if (len > 20) return 'text-xl md:text-2xl';
        return 'text-2xl md:text-3xl';
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
        const accuracy = items.length > 0 ? Math.round((stats.correct / items.length) * 100) : 0;
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                    <div className="text-6xl">{accuracy >= 80 ? '🎊' : accuracy >= 50 ? '👍' : '💪'}</div>
                    <h2 className="text-3xl font-medium">Session Complete</h2>
                    <div className="text-7xl font-bold tracking-tight">
                        {accuracy}<span className="text-3xl text-muted-foreground">%</span>
                    </div>
                    {isTimeUp && <p className="text-destructive font-medium">Time's up!</p>}
                    <p className="text-muted-foreground">
                        {stats.correct} correct · {stats.incorrect} incorrect
                    </p>
                </div>
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

    // Helper to detect Japanese/non-ASCII characters
    const isJapanese = (text) => /[^\x00-\x7F]/.test(text || '');

    // Smart content derivation to handle swapped fields from Anki import
    const getDisplayContent = (item) => {
        const meaningHasJp = isJapanese(item.meaning);
        const secondaryHasJp = isJapanese(item.secondaryText);

        let englishText = item.meaning;
        let readingText = item.secondaryText;

        // If meaning contains Japanese and secondary doesn't, they're swapped
        if (meaningHasJp && !secondaryHasJp && item.secondaryText) {
            englishText = item.secondaryText;
            readingText = item.meaning;
        }

        return {
            term: item.primaryText,
            english: englishText,
            reading: readingText
        };
    };

    const currentItem = items[currentIndex];
    const displayCurrent = getDisplayContent(currentItem);
    const progress = ((currentIndex) / items.length) * 100;

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
                            <span className="font-medium text-foreground">
                                {currentIndex + 1}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">
                                {items.length}
                            </span>
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
                <div className="h-2 bg-secondary rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Main Content */}
                {mode === 'flashcard' && (
                    <div className="space-y-6">
                        <div
                            className={cn(
                                "relative min-h-[400px] rounded-2xl p-8 sm:p-12 cursor-pointer border-2 transition-all",
                                feedback === 'correct' && "border-green-500 bg-green-50/50",
                                feedback === 'incorrect' && "border-red-500 bg-red-50/50",
                                !feedback && "border-border hover:border-primary/50 hover:shadow-lg bg-card"
                            )}
                            onClick={() => !feedback && setIsFlipped(!isFlipped)}
                        >
                            {!isFlipped ? (
                                <div className="h-full flex flex-col items-center justify-center text-center min-h-[350px]">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground mb-8">Term</span>
                                    <h2 className={cn("font-bold text-foreground leading-tight", getTextSize(displayCurrent.term))}>
                                        <Furigana
                                            text={displayCurrent.term}
                                            reading={displayCurrent.reading}
                                            show={settings.showFurigana}
                                        />
                                    </h2>
                                    <p className="mt-auto text-sm text-muted-foreground">Click or press Space to reveal</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center min-h-[350px] space-y-8">
                                    <div className="space-y-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">Reading</span>
                                        <p className={cn("text-foreground", getTextSize(currentItem.secondaryText, 'medium'))}>
                                            {currentItem.secondaryText || '—'}
                                        </p>
                                    </div>

                                    <div className="w-20 h-px bg-border" />

                                    <div className="space-y-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">Meaning</span>
                                        <p className={cn("text-foreground font-semibold", getTextSize(currentItem.meaning, 'medium'))}>
                                            {currentItem.meaning}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isFlipped && !feedback && (
                            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                <button
                                    onClick={() => handleNext(false)}
                                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all font-medium"
                                >
                                    <X className="w-5 h-5" />
                                    Again
                                </button>
                                <button
                                    onClick={() => handleNext(true)}
                                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/20"
                                >
                                    <Check className="w-5 h-5" />
                                    Got it
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'quiz' && (
                    <div className="space-y-8">
                        <div className="text-center space-y-4 py-8">
                            {quizDirection === 'reverse' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">Select the Japanese Term</span>
                            )}
                            <h2 className={cn("font-bold", getTextSize(quizDirection === 'reverse' ? displayCurrent.english : displayCurrent.term))}>
                                {quizDirection === 'reverse' ? (
                                    displayCurrent.english
                                ) : (
                                    <Furigana
                                        text={displayCurrent.term}
                                        reading={displayCurrent.reading}
                                        show={settings.showFurigana}
                                    />
                                )}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {quizOptions.map((option, idx) => {
                                const optContent = getDisplayContent(option);
                                const isCorrect = option.id === currentItem.id;
                                return (
                                    <button
                                        key={option.id}
                                        disabled={feedback !== null}
                                        onClick={() => handleNext(isCorrect)}
                                        className={cn(
                                            "p-5 rounded-xl border-2 text-left transition-all",
                                            feedback === null && "hover:border-primary hover:shadow-lg bg-card",
                                            feedback === 'correct' && isCorrect && "border-green-500 bg-green-50",
                                            feedback === 'incorrect' && isCorrect && "border-green-500 bg-green-50",
                                            feedback === 'incorrect' && !isCorrect && "opacity-50",
                                            !feedback && "border-border"
                                        )}
                                    >
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-xs font-medium text-muted-foreground mb-2">{idx + 1}</span>
                                        {quizDirection === 'reverse' ? (
                                            <div>
                                                <span className="font-semibold text-lg block">{optContent.term}</span>
                                                {optContent.reading && <div className="text-sm text-muted-foreground mt-1">{optContent.reading}</div>}
                                            </div>
                                        ) : (
                                            <span className="font-semibold">{optContent.english}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {mode === 'typing' && (
                    <div className="space-y-8">
                        <div className="text-center space-y-4 py-8">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">Type the reading</span>
                            <h2 className={cn("font-bold", getTextSize(displayCurrent.term))}>
                                {displayCurrent.term}
                            </h2>
                            <p className="text-muted-foreground text-lg italic">{displayCurrent.english}</p>
                        </div>

                        <form onSubmit={handleTypingSubmit} className="max-w-md mx-auto">
                            <input
                                autoFocus
                                value={typingInput}
                                onChange={e => setTypingInput(e.target.value)}
                                className={cn(
                                    "w-full text-center text-2xl sm:text-3xl p-4 sm:p-6 rounded-xl border-2 transition-all",
                                    "bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                                    feedback === 'correct' && "border-green-500 bg-green-50",
                                    feedback === 'incorrect' && "border-red-500 bg-red-50",
                                    !feedback && "border-border"
                                )}
                                placeholder="Type here..."
                                disabled={feedback !== null}
                                autoComplete="off"
                                autoCapitalize="off"
                            />
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}


