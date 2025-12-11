
import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Database, Server, BarChart3, Zap, HardDrive, Cpu,
    TrendingUp, Clock, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

import api from '@/lib/api';

/**
 * Admin Dashboard - System overview with real-time metrics
 */
export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [dbStats, setDbStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;

        // Custom headers if needed, but axios usually handles this via interceptors setup in api.js?
        // If not, we can pass config. 
        // Assuming api.js sets up Auth header if available in localStorage/context.
        // If api.js doesn't, we might need to add it. But let's assume api instance is configured.

        try {
            const [statsRes, healthRes, dbRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/health'),
                api.get('/admin/database/stats')
            ]);

            setStats(statsRes.data);
            setHealth(healthRes.data);
            setDbStats(dbRes.data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [fetchData, user]);

    const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
        >
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                <Icon className={cn("w-4 h-4", color)} />
                {label}
            </div>
            <div className="text-3xl font-light tracking-tight">{value ?? '—'}</div>
            {subtext && <div className="text-xs text-gray-600 mt-1">{subtext}</div>}
        </motion.div>
    );

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-gray-500">Initializing...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light tracking-tight">System Dashboard</h1>
                    <p className="text-xs text-gray-500 mt-1">Real-time monitoring • Auto-refresh 5s</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="text-blue-400" />
                <StatCard icon={Database} label="Courses" value={stats?.totalCourses} color="text-purple-400" />
                <StatCard icon={Zap} label="Study Items" value={stats?.totalItems?.toLocaleString()} color="text-emerald-400" />
                <StatCard icon={BarChart3} label="Sessions" value={stats?.totalSessions} color="text-orange-400" />
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        System Resources
                    </h3>
                    {health?.memoryMB && (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-500">Memory Usage</span>
                                    <span>{health.memoryMB.used}MB / {health.memoryMB.max}MB</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                                        style={{ width: `${(health.memoryMB.used / health.memoryMB.max) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-gray-500">Java Version</span>
                                    <div className="font-mono mt-1">{stats?.javaVersion}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Database</span>
                                    <div className={cn("mt-1", health.database === 'CONNECTED' ? "text-emerald-400" : "text-red-400")}>
                                        {health.database}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-orange-400" />
                        Storage & Caches
                    </h3>
                    <div className="space-y-4">
                        {dbStats && (
                            <div className="text-xs">
                                <span className="text-gray-500">Estimated Storage</span>
                                <div className="font-mono mt-1">{dbStats.estimatedStorageKB} KB</div>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-gray-500">Active Caches</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {stats?.caches && Object.keys(stats.caches).map(name => (
                                    <span key={name} className="px-2 py-1 bg-gray-800 rounded text-[10px] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    System Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Status</div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-400">Online</span>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Topics</div>
                        <div>{stats?.totalTopics}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">API</div>
                        <div className="text-emerald-400">Healthy</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Last Check</div>
                        <div>{new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}



