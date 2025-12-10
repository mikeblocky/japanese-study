// Removed framer-motion for static performance
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame, Target, Play, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StreakBadge from '@/components/StreakBadge';
import { api } from '@/lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalStudyMinutes: 0,
        totalSessions: 0,
        currentStreak: 0,
        recentActivity: []
    });
    const [dueCount, setDueCount] = useState(0);
    const [topicProgress, setTopicProgress] = useState([]);

    useEffect(() => {
        // Fetch Due Count
        fetch(api('/sessions/due?userId=1'))
            .then(res => res.json())
            .then(data => setDueCount(data.length))
            .catch(err => console.error("Failed to fetch due items", err));

        // Fetch StatsSummary
        fetch(api('/stats/summary'))
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setStats({
                    totalStudyMinutes: Math.floor((data.totalDuration || 0) / 60),
                    totalSessions: data.totalSessions || 0,
                    currentStreak: data.currentStreak || 0,
                    recentActivity: data.recentActivity || []
                });
            })
            .catch(err => console.error("Failed to fetch stats", err));

        // Fetch Topic Progress
        fetch(api('/progress/summary?userId=1'))
            .then(res => res.json())
            .then(data => setTopicProgress(data))
            .catch(err => console.error("Failed to fetch progress", err));
    }, []);

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">
                        {getGreeting()}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground/80 font-light max-w-xl">
                        Your journey continues. Everything is tracked, every step counts.
                    </p>
                </div>

                {/* Stats Overview - Glass Panels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Clock, label: "Study Time", value: formatDuration(stats.totalStudyMinutes), sub: "Total learning time", color: "text-blue-500", bg: "bg-blue-500/10" },
                        { icon: Flame, label: "Streak", value: `${stats.currentStreak} Days`, sub: "Keep the momentum", color: "text-orange-500", bg: "bg-orange-500/10" },
                        { icon: Target, label: "Sessions", value: stats.totalSessions, sub: "Completed sessions", color: "text-emerald-500", bg: "bg-emerald-500/10" }
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="p-8 rounded-[2rem] glass-panel border border-white/10 shadow-lg hover:shadow-float transition-shadow duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn("p-3 rounded-2xl", item.bg, item.color)}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                            </div>
                            <div className="text-4xl font-light tracking-tight">{item.value}</div>
                            <p className="text-sm text-muted-foreground mt-2 font-medium opacity-60">{item.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Recommended / Smart Review */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-light flex items-center gap-2">
                            <span>Smart Review</span>
                            {dueCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        </h2>

                        <div
                            className="relative p-8 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl group"
                        >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                            <div className="relative z-10 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-light">Time to Review</h3>
                                    <p className="text-white/70 text-lg font-light leading-relaxed max-w-md">
                                        {dueCount > 0
                                            ? `You have ${dueCount} words waiting. Spaced repetition ensures you never forget.`
                                            : "You're all caught up! Great job staying on top of your studies."}
                                    </p>
                                </div>

                                <Link
                                    to="/study/review"
                                    onClick={(e) => dueCount === 0 && e.preventDefault()}
                                    className={cn(
                                        "inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-colors duration-200",
                                        dueCount > 0
                                            ? "bg-white text-indigo-900 hover:bg-white/90 shadow-lg"
                                            : "bg-white/10 text-white/50 cursor-not-allowed border border-white/10"
                                    )}
                                >
                                    {dueCount > 0 ? (
                                        <>
                                            <Play className="w-5 h-5 fill-current" />
                                            Start Session
                                        </>
                                    ) : "Nothing Due"}
                                </Link>
                            </div>
                        </div>

                        {/* Daily Cards - Random Review */}
                        <div
                            className="relative p-8 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xl group"
                        >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                            <div className="relative z-10 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-light">Daily Cards</h3>
                                    <p className="text-white/70 text-lg font-light leading-relaxed max-w-md">
                                        Review random vocabulary from all lessons. Stay sharp across all topics!
                                    </p>
                                </div>

                                <Link
                                    to="/study/daily"
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-colors duration-200 bg-white text-emerald-700 hover:bg-white/90"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Start Daily Review
                                </Link>
                            </div>
                        </div>

                        {/* Topic Progress */}
                        <div className="p-8 rounded-[2rem] glass-panel border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-medium">Topic Mastery</h3>
                                <Link to="/courses" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">View All</Link>
                            </div>

                            {topicProgress.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">Complete lessons to see your progress.</p>
                            ) : (
                                <div className="space-y-5">
                                    {topicProgress.slice(0, 3).map((prog, i) => (
                                        <div key={prog.topicId} className="space-y-2 group">
                                            <div className="flex justify-between text-sm items-end">
                                                <span className="font-medium">Topic {prog.topicId}</span>
                                                <span className="font-mono text-muted-foreground">{prog.percentage}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative transition-all duration-500"
                                                    style={{ width: `${prog.percentage}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-light">Recent Activity</h2>
                        <div className="space-y-3">
                            {stats.recentActivity.length === 0 ? (
                                <div className="p-8 rounded-[2rem] glass-panel text-center text-muted-foreground italic">
                                    Your recent sessions will appear here.
                                </div>
                            ) : (
                                stats.recentActivity.map((activity, i) => (
                                    <div
                                        key={activity.id}
                                        className="group flex items-center justify-between p-5 rounded-2xl border border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors duration-200 cursor-default"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-lg">Study Session</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">{activity.date}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-mono font-medium text-foreground/80 bg-background/50 px-3 py-1 rounded-full">
                                            {formatDuration(activity.duration)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}



