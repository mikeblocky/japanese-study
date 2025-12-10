import API_BASE from '@/lib/api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Cpu, Activity, HardDrive, Recycle, Clock, Zap, Server,
    TrendingUp, Layers, ChevronRight, RefreshCw, Thermometer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

const api = (path) => `${API_BASE}/api${path}`;

/**
 * Admin Monitoring Page - Deep server metrics (JVM, Threads, GC, Diagnostics)
 */
export default function AdminMonitoring() {
    const { user } = useAuth();
    const [jvm, setJvm] = useState(null);
    const [threads, setThreads] = useState(null);
    const [gc, setGc] = useState(null);
    const [diag, setDiag] = useState(null);
    const [env, setEnv] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Pause auto-refresh when user is interacting
    const [pauseRefresh, setPauseRefresh] = useState(false);

    const fetchAll = useCallback(async () => {
        if (pauseRefresh || !user) return;

        const headers = { 'X-User-Id': user.id.toString() };

        setIsRefreshing(true);
        try {
            const [jvmRes, threadRes, gcRes, diagRes, envRes] = await Promise.all([
                fetch(api('/admin/metrics/jvm'), { headers }),
                fetch(api('/admin/metrics/threads'), { headers }),
                fetch(api('/admin/metrics/gc'), { headers }),
                fetch(api('/admin/diagnostics'), { headers }),
                fetch(api('/admin/environment'), { headers })
            ]);
            if (jvmRes.ok) setJvm(await jvmRes.json());
            if (threadRes.ok) setThreads(await threadRes.json());
            if (gcRes.ok) setGc(await gcRes.json());
            if (diagRes.ok) setDiag(await diagRes.json());
            if (envRes.ok) setEnv(await envRes.json());
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [pauseRefresh, user]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 10000); // Slower refresh for monitoring
        return () => clearInterval(interval);
    }, [fetchAll]);

    const MetricCard = ({ icon: Icon, title, value, unit, color, subValue }) => (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                <Icon className={cn("w-3.5 h-3.5", color)} />
                {title}
            </div>
            <div className="text-2xl font-light">
                {value ?? '—'}
                {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </div>
            {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
        </div>
    );

    const ProgressBar = ({ value, max, color = "from-purple-500 to-violet-500" }) => (
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                className={cn("h-full bg-gradient-to-r rounded-full", color)}
            />
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'memory', label: 'Memory', icon: HardDrive },
        { id: 'threads', label: 'Threads', icon: Layers },
        { id: 'gc', label: 'GC', icon: Recycle },
        { id: 'environment', label: 'Environment', icon: Server },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light tracking-tight">Server Monitoring</h1>
                    <p className="text-xs text-gray-500 mt-1">Deep JVM metrics • Auto-refresh 10s</p>
                </div>
                <button
                    onClick={fetchAll}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-900/50 rounded-lg border border-gray-800 w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-all",
                            activeTab === tab.id
                                ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                                : "text-gray-500 hover:text-white"
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                            icon={Clock}
                            title="Uptime"
                            value={diag?.uptimeFormatted}
                            color="text-emerald-400"
                        />
                        <MetricCard
                            icon={HardDrive}
                            title="Heap Used"
                            value={jvm?.memory?.heapUsed}
                            unit="MB"
                            color="text-purple-400"
                            subValue={`of ${jvm?.memory?.heapMax} MB`}
                        />
                        <MetricCard
                            icon={Cpu}
                            title="Processors"
                            value={jvm?.availableProcessors}
                            color="text-blue-400"
                        />
                        <MetricCard
                            icon={Layers}
                            title="Threads"
                            value={threads?.activeThreadCount}
                            color="text-orange-400"
                        />
                    </div>

                    {/* Memory Overview */}
                    {jvm?.memory && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Heap Memory</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{jvm.memory.heapUsed} MB used</span>
                                    <span>{jvm.memory.heapMax} MB max</span>
                                </div>
                                <ProgressBar value={jvm.memory.heapUsed} max={jvm.memory.heapMax} />
                            </div>
                        </div>
                    )}

                    {/* GC Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricCard
                            icon={Recycle}
                            title="GC Collections"
                            value={gc?.totalCollections}
                            color="text-cyan-400"
                        />
                        <MetricCard
                            icon={Zap}
                            title="GC Time"
                            value={gc?.totalGcTimeMs}
                            unit="ms"
                            color="text-yellow-400"
                        />
                    </div>
                </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && jvm && (
                <div className="space-y-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-purple-400" />
                            Heap Memory Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-light">{jvm.memory.heapUsed}</div>
                                <div className="text-xs text-gray-500 mt-1">Used (MB)</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-light">{jvm.memory.heapFree}</div>
                                <div className="text-xs text-gray-500 mt-1">Free (MB)</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-light">{jvm.memory.heapTotal}</div>
                                <div className="text-xs text-gray-500 mt-1">Total (MB)</div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-light">{jvm.memory.heapMax}</div>
                                <div className="text-xs text-gray-500 mt-1">Max (MB)</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <ProgressBar
                                value={jvm.memory.heapUsed}
                                max={jvm.memory.heapMax}
                                color="from-purple-500 to-pink-500"
                            />
                        </div>
                    </div>

                    {/* JVM Info */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">JVM Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {jvm.jvm && Object.entries(jvm.jvm).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-500">{key}</span>
                                    <span className="font-mono text-xs">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Threads Tab */}
            {activeTab === 'threads' && threads && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard icon={Layers} title="Active Threads" value={threads.activeThreadCount} color="text-blue-400" />
                        <MetricCard icon={TrendingUp} title="Peak Threads" value={threads.peakThreadCount} color="text-orange-400" />
                    </div>

                    {/* Thread States */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Thread States</h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {threads.threadStates && Object.entries(threads.threadStates).map(([state, count]) => (
                                <div key={state} className="p-3 bg-gray-800/50 rounded-lg text-center">
                                    <div className="text-lg font-light">{count}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{state}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sample Threads */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Sample Threads</h3>
                        <div className="space-y-2 font-mono text-xs">
                            {threads.sampleThreads?.map((thread, i) => (
                                <div key={i} className="p-2 bg-gray-800/50 rounded flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    {thread}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GC Tab */}
            {activeTab === 'gc' && gc && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard icon={Recycle} title="Total Collections" value={gc.totalCollections} color="text-cyan-400" />
                        <MetricCard icon={Clock} title="Total GC Time" value={gc.totalGcTimeMs} unit="ms" color="text-yellow-400" />
                    </div>

                    {/* GC Collectors */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Garbage Collectors</h3>
                        <div className="space-y-4">
                            {gc.collectors?.map((collector, i) => (
                                <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{collector.name}</span>
                                        <span className="text-xs text-gray-500">{collector.collectionCount} collections</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Time spent: {collector.collectionTimeMs} ms
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Environment Tab */}
            {activeTab === 'environment' && env && (
                <div className="space-y-6">
                    {/* System Info */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">System Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-500">OS</span>
                                <span>{env.osName} {env.osVersion}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-500">Architecture</span>
                                <span>{env.osArch}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-500">Hostname</span>
                                <span className="font-mono text-xs">{env.hostname}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-500">IP Address</span>
                                <span className="font-mono text-xs">{env.hostAddress}</span>
                            </div>
                        </div>
                    </div>

                    {/* Disk Space */}
                    {env.disks && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Disk Space</h3>
                            <div className="space-y-4">
                                {env.disks.map((disk, i) => (
                                    <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono">{disk.path}</span>
                                            <span className="text-xs text-gray-500">
                                                {disk.freeSpaceGB} GB free / {disk.totalSpaceGB} GB
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={disk.totalSpaceGB - disk.freeSpaceGB}
                                            max={disk.totalSpaceGB}
                                            color="from-orange-500 to-red-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paths */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Paths</h3>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="p-2 bg-gray-800/50 rounded flex gap-2">
                                <span className="text-gray-500 w-24">Java Home:</span>
                                <span className="truncate">{env.javaHome}</span>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded flex gap-2">
                                <span className="text-gray-500 w-24">User Dir:</span>
                                <span className="truncate">{env.userDir}</span>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded flex gap-2">
                                <span className="text-gray-500 w-24">Temp Dir:</span>
                                <span className="truncate">{env.tempDir}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnostics */}
            {diag && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        Diagnostics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-gray-500 mb-1">Start Time</div>
                            <div className="font-mono text-[10px]">{diag.startTime}</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-gray-500 mb-1">Classes Loaded</div>
                            <div>{diag.classes?.loaded}</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-gray-500 mb-1">Total Classes</div>
                            <div>{diag.classes?.totalLoaded}</div>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-gray-500 mb-1">Compilation Time</div>
                            <div>{diag.compilation?.totalCompilationTimeMs} ms</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



