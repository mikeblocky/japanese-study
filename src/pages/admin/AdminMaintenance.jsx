import React, { useState, useEffect } from 'react';
import { Wrench, Trash2, Database, RefreshCw, Layers, AlertTriangle, CheckCircle, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin Maintenance Page - System maintenance and cleanup operations
 */
export default function AdminMaintenance() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null); // Keep stats for the status section
    const [status, setStatus] = useState(null); // New state for action feedback
    const [loading, setLoading] = useState(false); // Simplified loading state

    useEffect(() => {
        if (!user) return;
        // Fetch stats using the new api instance
        api.get('/admin/stats', { headers: { 'X-User-Id': user.id.toString() } })
            .then(setStats)
            .catch(error => console.error("Failed to fetch stats:", error));
    }, [user]);

    // Run actions
    const runAction = async (action, name) => {
        if (!user) return;
        if (!confirm(`Run ${name}?`)) return;
        setLoading(true);
        setStatus(null);
        try {
            await action();
            setStatus({ type: 'success', text: `${name} completed successfully` });
        } catch (err) {
            setStatus({ type: 'error', text: err.message || `Failed to ${name} ` });
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => runAction(async () => {
        await api.post('/admin/cache/clear', {}, { headers: { 'X-User-Id': user.id.toString() } });
    }, "Clear System Cache");

    const reindexSearch = () => runAction(async () => {
        // Placeholder for future implementation
        await new Promise(r => setTimeout(r, 1000));
        // Example: await api.post('/admin/search/reindex', {}, { headers: { 'X-User-Id': user.id.toString() } });
    }, "Rebuild Search Index");

    const vacuumDb = () => runAction(async () => {
        // Placeholder for future implementation
        await new Promise(r => setTimeout(r, 1000));
        // Example: await api.post('/admin/db/vacuum', {}, { headers: { 'X-User-Id': user.id.toString() } });
    }, "Vacuum API Database");

    const resetSessions = () => runAction(async () => {
        await api.post('/admin/maintenance/reset-sessions', {}, { headers: { 'X-User-Id': user.id.toString() } });
    }, "Reset All Sessions");

    const MaintenanceAction = ({ icon: Icon, title, description, button, onClick, danger }) => (
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
                    description={`Permanently deletes all ${stats?.totalSessions ?? 0} study sessions.This removes all user progress and statistics.`}
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



