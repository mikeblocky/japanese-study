import API_BASE from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { Wrench, Trash2, RefreshCw, AlertTriangle, CheckCircle, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

const api = (path) => `${API_BASE}/api${path}`;

/**
 * Admin Maintenance Page - System maintenance and cleanup operations
 */
export default function AdminMaintenance() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState({});

    useEffect(() => {
        if (!user) return;
        fetch(api('/admin/stats'), { headers: { 'X-User-Id': user.id.toString() } })
            .then(r => r.ok && r.json())
            .then(setStats);
    }, [user]);

    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const withLoading = async (key, action) => {
        setLoading(l => ({ ...l, [key]: true }));
        try {
            await action();
        } finally {
            setLoading(l => ({ ...l, [key]: false }));
        }
    };

    const handleClearAllCaches = () => withLoading('cache', async () => {
        if (!user) return;
        const res = await fetch(api('/admin/cache/clear'), {
            method: 'POST',
            headers: { 'X-User-Id': user.id.toString() }
        });
        if (res.ok) showToast('success', 'All caches cleared');
    });

    const handleResetAllSessions = () => withLoading('sessions', async () => {
        if (!user) return;
        if (!confirm('Delete ALL study sessions? This cannot be undone!')) return;
        const res = await fetch(api('/admin/maintenance/reset-sessions'), {
            method: 'POST',
            headers: { 'X-User-Id': user.id.toString() }
        });
        if (res.ok) {
            const result = await res.json();
            showToast('success', result.message);
        }
    });

    const MaintenanceAction = ({ icon: Icon, title, description, button, onClick, loading: isLoading, danger }) => (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-lg", danger ? "bg-red-500/10" : "bg-gray-800")}>
                    <Icon className={cn("w-5 h-5", danger ? "text-red-400" : "text-gray-400")} />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{description}</p>
                    <button
                        onClick={onClick}
                        disabled={isLoading}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                            danger
                                ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
                                : "bg-gray-800 hover:bg-gray-700 text-white"
                        )}
                    >
                        {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : button.icon}
                        {button.label}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-light tracking-tight">System Maintenance</h1>
                <p className="text-xs text-gray-500 mt-1">Cleanup and optimization operations</p>
            </div>

            {/* Toast */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-3 rounded-lg flex items-center gap-2 text-sm",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}
                >
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {message.text}
                </motion.div>
            )}

            {/* Warning Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                    <h4 className="font-medium text-yellow-400">Caution Required</h4>
                    <p className="text-xs text-yellow-400/70 mt-1">
                        Maintenance operations can permanently delete data. Make sure to backup before proceeding.
                    </p>
                </div>
            </div>

            {/* Maintenance Actions */}
            <div className="grid gap-4">
                <MaintenanceAction
                    icon={Zap}
                    title="Clear All Caches"
                    description="Clears application caches. No data is lost, but the next requests will be slower as caches rebuild."
                    button={{ icon: <Zap className="w-3 h-3" />, label: 'Clear Caches' }}
                    onClick={handleClearAllCaches}
                    loading={loading.cache}
                />

                <MaintenanceAction
                    icon={Trash2}
                    title="Reset All Sessions"
                    description={`Permanently deletes all ${stats?.totalSessions ?? 0} study sessions. This removes all user progress and statistics.`}
                    button={{ icon: <Trash2 className="w-3 h-3" />, label: 'Reset Sessions' }}
                    onClick={handleResetAllSessions}
                    loading={loading.sessions}
                    danger
                />
            </div>

            {/* Current Status */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Current Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Active Caches</div>
                        <div>{stats?.caches ? Object.keys(stats.caches).length : 0}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Sessions</div>
                        <div>{stats?.totalSessions ?? 0}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Memory Used</div>
                        <div>{stats?.usedMemoryMB ?? 0} MB</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-gray-500 mb-1">Status</div>
                        <div className="text-emerald-400">Healthy</div>
                    </div>
                </div>
            </div>
        </div>
    );
}



