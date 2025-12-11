import React, { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Activity, Clock, Wifi, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin System Page - System information and health monitoring
 */
export default function AdminSystem() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, healthRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/health')
                ]);
                setStats(statsRes.data);
                setHealth(healthRes.data);
            } catch (err) {
                console.error("System fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const InfoRow = ({ label, value, status }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className={cn("text-sm font-mono", status === 'good' && "text-emerald-400", status === 'warn' && "text-yellow-400")}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-light tracking-tight">System Information</h1>
                <p className="text-xs text-gray-500 mt-1">Server configuration and runtime details</p>
            </div>

            {/* Health Status */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Health Status
                </h3>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg",
                        health?.status === 'UP' ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                        <span className={cn(
                            "w-3 h-3 rounded-full animate-pulse",
                            health?.status === 'UP' ? "bg-emerald-400" : "bg-red-400"
                        )} />
                        <span className={cn(
                            "text-lg font-medium",
                            health?.status === 'UP' ? "text-emerald-400" : "text-red-400"
                        )}>
                            {health?.status === 'UP' ? 'All Systems Operational' : 'System Issues Detected'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Java Runtime */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        Runtime Environment
                    </h3>
                    <div className="space-y-0">
                        <InfoRow label="Java Version" value={stats?.javaVersion ?? '—'} />
                        <InfoRow label="Framework" value="Spring Boot 3.4.0" />
                        <InfoRow label="Database" value={health?.database ?? '—'} status={health?.database === 'CONNECTED' ? 'good' : 'warn'} />
                    </div>
                </div>

                {/* Memory */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        Memory Usage
                    </h3>
                    {health?.memoryMB && (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-500">Heap Memory</span>
                                    <span>{health.memoryMB.used} / {health.memoryMB.max} MB</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(health.memoryMB.used / health.memoryMB.max) * 100}% ` }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2 bg-gray-800/50 rounded">
                                    <div className="text-gray-500">Used</div>
                                    <div>{health.memoryMB.used} MB</div>
                                </div>
                                <div className="p-2 bg-gray-800/50 rounded">
                                    <div className="text-gray-500">Free</div>
                                    <div>{health.memoryMB.free} MB</div>
                                </div>
                                <div className="p-2 bg-gray-800/50 rounded">
                                    <div className="text-gray-500">Max</div>
                                    <div>{health.memoryMB.max} MB</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Caches */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-400" />
                    Cache Status
                </h3>
                <div className="flex flex-wrap gap-2">
                    {stats?.caches ? Object.entries(stats.caches).map(([name, status]) => (
                        <div key={name} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-xs">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="font-mono">{name}</span>
                            <span className="text-emerald-400">{status}</span>
                        </div>
                    )) : (
                        <span className="text-gray-500 text-sm">No active caches</span>
                    )}
                </div>
            </div>

            {/* Server Time */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Server Time
                </h3>
                <div className="font-mono text-xl">
                    {stats?.serverTime ? new Date(stats.serverTime).toLocaleString() : '—'}
                </div>
            </div>
        </div>
    );
}



