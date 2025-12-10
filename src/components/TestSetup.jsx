import API_BASE from '@/lib/api';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, X, Check, Search, Timer, AlignJustify, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TestSetup({ onStart, onCancel }) {
    const [count, setCount] = useState(10);
    const [mode, setMode] = useState('quiz'); // quiz, typing
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [timeLimit, setTimeLimit] = useState(0); // 0 = None, value in seconds
    const [availableTopics, setAvailableTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Mobile-specific state
    const [mobileStep, setMobileStep] = useState(0); // 0: Config, 1: Topics

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Fetch Topics on Mount
    useState(() => {
        fetch('`${API_BASE}/api/data/courses')
            .then(res => res.json())
            .then(data => {
                const allTopics = data.flatMap(course =>
                    (course.topics || []).map(t => ({ ...t, courseTitle: course.title }))
                );
                setAvailableTopics(allTopics);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch topics", err);
                setLoading(false);
            });
    }, []);

    const toggleTopic = (id) => {
        if (selectedTopics.includes(id)) {
            setSelectedTopics(prev => prev.filter(t => t !== id));
        } else {
            setSelectedTopics(prev => [...prev, id]);
        }
    };

    const filteredTopics = availableTopics.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl md:p-4">
            {/* Mobile View (Single Column, Step-based or Long Scroll) */}
            <div className="md:hidden w-full h-full bg-background flex flex-col">
                {/* Mobile Header */}
                <div className="px-6 py-6 border-b border-border/40 flex items-center justify-between bg-background/95 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-light tracking-tight">New Session</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{mobileStep === 0 ? "Configuration" : "Select Topics"}</p>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {mobileStep === 0 && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            {/* Mode Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <AlignJustify className="w-4 h-4 text-primary" /> Study Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['quiz', 'typing'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={cn(
                                                "p-4 rounded-2xl border text-left transition-all",
                                                mode === m ? "bg-primary/10 border-primary text-primary" : "bg-secondary/30 border-transparent text-muted-foreground"
                                            )}
                                        >
                                            <div className="capitalize font-medium text-lg">{m}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Count Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Hash className="w-4 h-4 text-primary" /> Item Count
                                </label>
                                <div className="flex gap-2 bg-secondary/30 p-1.5 rounded-xl">
                                    {[10, 20, 30, 50].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCount(c)}
                                            className={cn(
                                                "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                                                count === c ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timer Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Timer className="w-4 h-4 text-primary" /> Timer
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 60, 180, 300].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeLimit(t)}
                                            className={cn(
                                                "py-3 rounded-xl border text-sm font-medium transition-all",
                                                timeLimit === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                                            )}
                                        >
                                            {t === 0 ? "∞" : t / 60 + "m"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mobileStep === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    placeholder="Search topics..."
                                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {filteredTopics.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => toggleTopic(topic.id)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98]",
                                            selectedTopics.includes(topic.id) ? "bg-primary/5 border-primary/30" : "bg-card border-border/50"
                                        )}
                                    >
                                        <span className={cn("font-medium", selectedTopics.includes(topic.id) ? "text-primary" : "text-foreground")}>{topic.title}</span>
                                        {selectedTopics.includes(topic.id) && <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground"><Check className="w-3 h-3" /></div>}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Mobile Styles Footer Action */}
                <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur-md">
                    {mobileStep === 0 ? (
                        <button
                            onClick={() => setMobileStep(1)}
                            className="w-full py-4 bg-foreground text-background rounded-xl font-medium text-lg shadow-lg active:scale-[0.98] transition-transform"
                        >
                            Next: Select Topics
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setMobileStep(0)}
                                className="px-6 py-4 bg-secondary text-foreground rounded-xl font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => onStart({ count, mode, topicIds: selectedTopics, timeLimit })}
                                className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                            >
                                Start ({selectedTopics.length || "All"})
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Desktop View (Original + Filtering) */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden md:flex w-full max-w-6xl bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex-row h-[85vh] min-h-[600px] relative"
            >
                {/* Left Panel: Configuration */}
                <div className="flex-1 p-12 space-y-10 overflow-y-auto custom-scrollbar bg-gradient-to-br from-background/50 to-secondary/5">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl ring-4 ring-primary/5">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-light tracking-tight">Configuration</h2>
                                <p className="text-muted-foreground text-sm mt-1">Customize your session parameters</p>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Study Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('quiz')}
                                    className={cn(
                                        "relative group overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left",
                                        mode === 'quiz'
                                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                            : "border-border hover:border-foreground/20 hover:bg-secondary/40"
                                    )}
                                >
                                    <div className="font-medium mb-1 text-xl group-hover:text-primary transition-colors">Quiz Mode</div>
                                    <div className="text-sm text-muted-foreground">Standard multiple choice</div>
                                    {mode === 'quiz' && <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary rounded-2xl" />}
                                </button>
                                <button
                                    onClick={() => setMode('typing')}
                                    className={cn(
                                        "relative group overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left",
                                        mode === 'typing'
                                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                            : "border-border hover:border-foreground/20 hover:bg-secondary/40"
                                    )}
                                >
                                    <div className="font-medium mb-1 text-xl group-hover:text-primary transition-colors">Typing Mode</div>
                                    <div className="text-sm text-muted-foreground">Type reading validation</div>
                                    {mode === 'typing' && <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary rounded-2xl" />}
                                </button>
                            </div>
                        </div>

                        {/* Question Count */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Question Count</label>
                            <div className="bg-secondary/30 p-1.5 rounded-2xl flex gap-2">
                                {[10, 20, 50].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setCount(val)}
                                        className={cn(
                                            "flex-1 py-4 rounded-xl text-sm font-medium transition-all duration-300 relative",
                                            count === val
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                    >
                                        {val} Questions
                                        {count === val && <motion.div layoutId="active-count" className="absolute inset-0 rounded-xl ring-1 ring-black/5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Limit */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Time Pressure</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[0, 60, 180, 300].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setTimeLimit(val)}
                                        className={cn(
                                            "py-4 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95",
                                            timeLimit === val
                                                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "border-border bg-card hover:border-primary/30"
                                        )}
                                    >
                                        {val === 0 ? "∞" : Math.floor(val / 60) + "m"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Topics & Actions */}
                <div className="w-[450px] border-l border-border/50 bg-card/50 flex flex-col relative">
                    <button
                        onClick={onCancel}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/80 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </button>

                    <div className="p-10 flex-1 flex flex-col min-h-0 pt-10">
                        {/* Search & Header */}
                        <div className="space-y-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-foreground">Selected Topics</label>
                                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                                        {selectedTopics.length || "All"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedTopics(selectedTopics.length === availableTopics.length ? [] : availableTopics.map(t => t.id))}
                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                                >
                                    {selectedTopics.length === availableTopics.length ? "Clear All" : "Select All"}
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    placeholder="Filter topics..."
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {loading && (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-secondary/30 animate-pulse rounded-xl" />)}
                                </div>
                            )}
                            {filteredTopics.length === 0 && !loading && (
                                <div className="text-center p-8 text-muted-foreground">No matching topics found.</div>
                            )}
                            {filteredTopics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => toggleTopic(topic.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between group border",
                                        selectedTopics.includes(topic.id)
                                            ? "bg-primary/5 border-primary/20 text-foreground"
                                            : "bg-transparent border-transparent hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span className="truncate font-medium">{topic.title}</span>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shadow-sm",
                                        selectedTopics.includes(topic.id)
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                    )}>
                                        {selectedTopics.includes(topic.id) && <Check className="w-3 h-3" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                        <button
                            onClick={() => onStart({ count, mode, topicIds: selectedTopics, timeLimit })}
                            className="w-full py-5 rounded-2xl bg-foreground text-background font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/5"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Start Session
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}



