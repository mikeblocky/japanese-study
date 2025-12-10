import API_BASE from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Circle, Calendar, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const GoalsPage = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const response = await fetch('`${API_BASE}/api/goals');
            if (response.ok) {
                const data = await response.json();
                setGoals(data);
            }
        } catch (error) {
            console.error("Failed to fetch goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;

        try {
            const response = await fetch('`${API_BASE}/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newGoalTitle,
                    description: '',
                    targetDate: new Date().toISOString().split('T')[0] // Default to today
                })
            });

            if (response.ok) {
                setNewGoalTitle('');
                setIsAdding(false);
                fetchGoals();
            }
        } catch (error) {
            console.error("Failed to add goal", error);
        }
    };

    const toggleGoal = async (id) => {
        setGoals(goals.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g)); // Optimistic UI
        try {
            await fetch(`${API_BASE}/api/goals/${id}/toggle`, { method: 'PUT' });
        } catch (error) {
            console.error("Failed to toggle goal", error);
            fetchGoals(); // Revert on error
        }
    };

    const deleteGoal = async (id) => {
        if (!window.confirm("Delete this goal?")) return;
        try {
            const response = await fetch(`${API_BASE}/api/goals/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setGoals(goals.filter(g => g.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete goal", error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground/60 font-light text-xl">Loading goals...</div>;

    const completedCount = goals.filter(g => g.isCompleted).length;
    const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

    return (
        <div className="pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">Goals</h1>
                        <p className="text-lg md:text-xl text-muted-foreground/80 font-light">Focus on your next milestone.</p>
                    </div>

                    {/* Overall Progress */}
                    <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground font-bold">
                                <span>Completion</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Goal Section */}
                <div className="relative">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-6 rounded-2xl border-2 border-dashed border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-3 font-light text-lg group"
                        >
                            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span>Set a new goal</span>
                        </button>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleAddGoal}
                            className="glass-panel p-2 rounded-2xl flex items-center gap-2"
                        >
                            <input
                                autoFocus
                                type="text"
                                className="flex-1 px-6 py-4 bg-transparent text-xl font-light placeholder:text-muted-foreground/30 focus:outline-none"
                                placeholder="What do you want to achieve?"
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                            />
                            <div className="flex items-center gap-2 pr-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="p-3 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>

                {/* Goals List */}
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {goals.length === 0 && !isAdding && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20 text-muted-foreground font-light"
                            >
                                No active goals. Set one to start tracking!
                            </motion.div>
                        )}
                        {goals.map(goal => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className={cn(
                                    "group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 border",
                                    goal.isCompleted
                                        ? "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                        : "glass-panel border-white/10 hover:border-white/20 hover:shadow-float"
                                )}
                            >
                                <div className="flex items-start gap-5 relative z-10">
                                    <button
                                        onClick={() => toggleGoal(goal.id)}
                                        className={cn(
                                            "mt-1 p-3 rounded-full border transition-all duration-300 flex items-center justify-center",
                                            goal.isCompleted
                                                ? "bg-green-500/20 border-green-500 text-green-500 scale-110"
                                                : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-foreground hover:scale-105"
                                        )}
                                    >
                                        {goal.isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>

                                    <div className="flex-1 space-y-1">
                                        <h3 className={cn(
                                            "text-2xl font-light transition-all duration-300",
                                            goal.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                        )}>
                                            {goal.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground/60 font-mono">
                                            <Calendar className="w-3 h-3" />
                                            <span>Target: {goal.targetDate}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteGoal(goal.id)}
                                        className="p-3 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Goal"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Subtle Progress Background for completed items */}
                                {goal.isCompleted && (
                                    <motion.div
                                        layoutId={`bg-${goal.id}`}
                                        className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default GoalsPage;




