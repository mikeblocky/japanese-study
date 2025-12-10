import API_BASE from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Calendar, TrendingUp, Award, BarChart3, Activity, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const StatsPage = () => {
    const [stats, setStats] = useState(null);
    const [mastery, setMastery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, masteryRes] = await Promise.all([
                    fetch('`${API_BASE}/api/sessions/stats?userId=1'),
                    fetch('`${API_BASE}/api/sessions/mastery?userId=1')
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }
                if (masteryRes.ok) {
                    const masteryData = await masteryRes.json();
                    setMastery(masteryData);
                }
            } catch (err) {
                console.error("Failed to load stats", err);
                setError("Could not load statistics. Is the backend running?");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Format duration safely
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0m';
        if (seconds < 60) return '1m'; // Minimum 1m if some seconds exist but < 60? or just 0.
        // Dashboard uses detailed format, let's match dashboard's logic if possible, 
        // but dashboard uses minutes input. Here we have seconds.
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground/60 font-light text-xl gap-4 animate-pulse">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Wait a moment...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="text-4xl">📊</div>
                <p className="text-xl font-light">{error}</p>
            </div>
        );
    }

    // Safe values with defaults
    const totalDuration = stats?.totalDuration || 0;
    const totalSessions = stats?.totalSessions || 0;
    const historyData = stats?.history || [];
    const masteredCount = mastery.filter(m => m.srsLevel >= 7).length;
    const totalItems = mastery.length;

    // Calculate Mastery Distribution with colors
    const masteryDist = [
        { name: 'New', count: mastery.filter(m => !m.srsLevel || m.srsLevel === 0).length, fill: '#94A3B8' },
        { name: 'Learning', count: mastery.filter(m => m.srsLevel > 0 && m.srsLevel < 4).length, fill: '#60A5FA' },
        { name: 'Review', count: mastery.filter(m => m.srsLevel >= 4 && m.srsLevel < 7).length, fill: '#34D399' },
        { name: 'Mastered', count: mastery.filter(m => m.srsLevel >= 7).length, fill: '#FBBF24' },
    ].filter(d => d.count > 0);

    const metrics = [
        { icon: Clock, label: "Total Time", value: formatDuration(totalDuration), sub: "Lifetime study duration", color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: Activity, label: "Sessions", value: totalSessions, sub: "Total sessions completed", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: BookOpen, label: "Items Studied", value: totalItems, sub: "Total words encountered", color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: Award, label: "Mastered", value: masteredCount, sub: "Words at SRS Level 7+", color: "text-amber-500", bg: "bg-amber-500/10" }
    ];

    return (
        <div className="pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">Statistics</h1>
                    <p className="text-lg md:text-xl text-muted-foreground/80 font-light max-w-xl">
                        Your learning progress at a glance.
                    </p>
                </div>

                {/* Key Metrics - Exact Dashboard Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-[2rem] glass-panel border border-white/10 shadow-lg hover:shadow-float transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", item.bg, item.color)}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                            </div>
                            <div className="text-4xl font-light tracking-tight truncate">{item.value}</div>
                            <p className="text-sm text-muted-foreground mt-2 font-medium opacity-60 truncate">{item.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Charts - Styled like Dashboard panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-[2rem] glass-panel border border-white/10 shadow-lg space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-light">Study Activity</h3>
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">Last 30 Days</p>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            {historyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => {
                                                const parts = val?.split('-');
                                                return parts ? `${parts[1]}/${parts[2]}` : val;
                                            }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                backdropFilter: 'blur(8px)'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorActivity)"
                                            name="Sessions"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground italic font-light">
                                    No activity data yet. Start studying!
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Mastery Distribution */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-8 rounded-[2rem] glass-panel border border-white/10 shadow-lg space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-light">SRS Distribution</h3>
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">Mastery Levels</p>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            {masteryDist.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={masteryDist} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 500 }}
                                            width={80}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                backdropFilter: 'blur(8px)'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32} animationDuration={1500}>
                                            {masteryDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground italic font-light">
                                    No mastery data yet. Complete some reviews!
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;




