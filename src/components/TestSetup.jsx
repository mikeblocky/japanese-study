import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Play, X, Check, Search, Timer, AlignJustify, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TestSetup({ onStart, onCancel }) {
    const [count, setCount] = useState(10);
    const [mode, setMode] = useState('quiz');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [timeLimit, setTimeLimit] = useState(0);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        api.get('/courses')
            .then(res => {
                if (!active) return;
                const data = res.data || [];
                const allTopics = data.flatMap(course =>
                    (course.topics || []).map(t => ({ ...t, courseTitle: course.title }))
                );
                setAvailableTopics(allTopics);
            })
            .catch(err => {
                if (active) console.error("Failed to fetch topics", err);
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const toggleTopic = (id) => {
        setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const filteredTopics = availableTopics.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 md:border-b-0 md:border-r">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">New Session</h2>
                            <p className="text-sm text-slate-500">Configure and pick topics</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-md hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 space-y-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <AlignJustify className="w-4 h-4 text-indigo-600" /> Study mode
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['quiz', 'typing'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={cn(
                                            "p-4 rounded-xl border text-left",
                                            mode === m ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="capitalize font-semibold">{m}</div>
                                        <p className="text-xs text-slate-500 mt-1">{m === 'quiz' ? 'Multiple choice' : 'Type the reading'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-indigo-600" /> Question count
                            </label>
                            <div className="flex gap-2">
                                {[10, 20, 50].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setCount(val)}
                                        className={cn(
                                            "flex-1 py-3 rounded-lg border text-sm font-medium",
                                            count === val ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Timer className="w-4 h-4 text-indigo-600" /> Time limit
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[0, 60, 180, 300].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setTimeLimit(val)}
                                        className={cn(
                                            "py-3 rounded-lg border text-sm font-medium",
                                            timeLimit === val ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {val === 0 ? 'None' : `${Math.floor(val / 60)}m`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="text-sm text-slate-600">
                            <div className="font-semibold mb-1">Summary</div>
                            <div>{count} questions · {timeLimit === 0 ? 'No timer' : `${Math.floor(timeLimit / 60)} minute limit`}</div>
                            <div>{selectedTopics.length === 0 ? 'All topics' : `${selectedTopics.length} topic(s) selected`}</div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-slate-700">Topics</div>
                                <p className="text-xs text-slate-500">Choose which topics to include</p>
                            </div>
                            <button
                                onClick={() => setSelectedTopics(selectedTopics.length === availableTopics.length ? [] : availableTopics.map(t => t.id))}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                            >
                                {selectedTopics.length === availableTopics.length ? 'Clear all' : 'Select all'}
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Search topics"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                            {loading && (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                                    ))}
                                </div>
                            )}
                            {!loading && filteredTopics.length === 0 && (
                                <div className="text-sm text-slate-500">No matching topics.</div>
                            )}
                            {!loading && filteredTopics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => toggleTopic(topic.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm",
                                        selectedTopics.includes(topic.id)
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">{topic.title}</span>
                                        <span className="text-xs text-slate-500">{topic.courseTitle}</span>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center",
                                        selectedTopics.includes(topic.id)
                                            ? "border-indigo-500 bg-indigo-500 text-white"
                                            : "border-slate-300"
                                    )}>
                                        {selectedTopics.includes(topic.id) && <Check className="w-3 h-3" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onStart({ count, mode, topicIds: selectedTopics, timeLimit })}
                        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
                    >
                        <div className="inline-flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            Start session
                        </div>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}



