import React, { useState, useEffect, useCallback } from 'react';
import {
    Cpu, Activity, HardDrive, Recycle, Clock, Zap, Server,
    TrendingUp, Layers, ChevronRight, RefreshCw, Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard, ProgressBar } from '@/components/admin/MetricComponents';

/**
 * Admin Monitoring Page - Deep server metrics (JVM, Threads, GC, Diagnostics)
 */
export default function AdminMonitoring() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({ jvm: {}, threads: {}, gc: {}, diagnostics: {}, environment: {} });
    const [activeTab, setActiveTab] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [pauseRefresh, setPauseRefresh] = useState(false);

    const { jvm, threads, gc, diagnostics: diag, environment: env } = metrics || {};

    const fetchAll = useCallback(async () => {
        if (pauseRefresh || !user) return;

        setIsRefreshing(true);
        setFetchError(null);
        try {
            const [jvmRes, threadRes, gcRes, diagRes, envRes] = await Promise.all([
                api.get('/admin/metrics/jvm'),
                api.get('/admin/metrics/threads'),
                api.get('/admin/metrics/gc'),
                api.get('/admin/diagnostics'),
                api.get('/admin/environment')
            ]);

            setMetrics({
                jvm: jvmRes.data,
                threads: threadRes.data,
                gc: gcRes.data,
                diagnostics: diagRes.data,
                environment: envRes.data
            });
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
            const status = err?.response?.status;
            if (status === 403) {
                setFetchError('Not authorized to view monitoring (admin only).');
            } else if (status === 404) {
                setFetchError('Monitoring endpoints are not available on this backend deployment.');
            } else {
                setFetchError('Failed to load monitoring data.');
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [pauseRefresh, user]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 10000);
        return () => clearInterval(interval);
    }, [fetchAll]);

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

            {fetchError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-xs">
                    {fetchError}
                </div>
            )}

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard icon={Clock} title="Uptime" value={diag?.uptimeFormatted} color="text-emerald-400" />
                        <MetricCard icon={HardDrive} title="Heap Used" value={jvm?.memory?.heapUsed} unit="MB" color="text-purple-400" subValue={`of ${jvm?.memory?.heapMax} MB`} />
                        <MetricCard icon={Cpu} title="Processors" value={jvm?.availableProcessors} color="text-blue-400" />
                        <MetricCard icon={Layers} title="Threads" value={threads?.activeThreadCount} color="text-orange-400" />
                    </div>
                    {jvm?.memory && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Heap Memory</h3>
                            <div className="flex justify-between text-xs mb-1">
                                <span>{jvm.memory.heapUsed} MB used</span>
                                <span>{jvm.memory.heapMax} MB max</span>
                            </div>
                            <ProgressBar value={jvm.memory.heapUsed} max={jvm.memory.heapMax} />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricCard icon={Recycle} title="GC Collections" value={gc?.totalCollections} color="text-cyan-400" />
                        <MetricCard icon={Zap} title="GC Time" value={gc?.totalGcTimeMs} unit="ms" color="text-yellow-400" />
                    </div>
                </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && jvm && (
                <div className="space-y-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-purple-400" /> Heap Memory Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['heapUsed', 'heapFree', 'heapTotal', 'heapMax'].map(key => (
                                <div key={key} className="p-4 bg-gray-800/50 rounded-lg text-center">
                                    <div className="text-2xl font-light">{jvm.memory?.[key]}</div>
                                    <div className="text-xs text-gray-500 mt-1">{key.replace('heap', '')} (MB)</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <ProgressBar value={jvm.memory?.heapUsed} max={jvm.memory?.heapMax} color="from-purple-500 to-pink-500" />
                        </div>
                    </div>
                    {jvm.jvm && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">JVM Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {Object.entries(jvm.jvm).map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-2 border-b border-gray-800">
                                        <span className="text-gray-500">{key}</span>
                                        <span className="font-mono text-xs">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Threads Tab */}
            {activeTab === 'threads' && threads && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard icon={Layers} title="Active Threads" value={threads.activeThreadCount} color="text-blue-400" />
                        <MetricCard icon={TrendingUp} title="Peak Threads" value={threads.peakThreadCount} color="text-orange-400" />
                    </div>
                    {threads.threadStates && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Thread States</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {Object.entries(threads.threadStates).map(([state, count]) => (
                                    <div key={state} className="p-3 bg-gray-800/50 rounded-lg text-center">
                                        <div className="text-lg font-light">{count}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{state}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {threads.sampleThreads && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Sample Threads</h3>
                            <div className="space-y-2 font-mono text-xs">
                                {threads.sampleThreads.map((thread, i) => (
                                    <div key={i} className="p-2 bg-gray-800/50 rounded flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        {thread}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* GC Tab */}
            {activeTab === 'gc' && gc && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard icon={Recycle} title="Total Collections" value={gc.totalCollections} color="text-cyan-400" />
                        <MetricCard icon={Clock} title="Total GC Time" value={gc.totalGcTimeMs} unit="ms" color="text-yellow-400" />
                    </div>
                    {gc.collectors && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Garbage Collectors</h3>
                            <div className="space-y-4">
                                {gc.collectors.map((collector, i) => (
                                    <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">{collector.name}</span>
                                            <span className="text-xs text-gray-500">{collector.collectionCount} collections</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Time spent: {collector.collectionTimeMs} ms</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Environment Tab */}
            {activeTab === 'environment' && env && (
                <div className="space-y-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">System Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {[
                                ['OS', `${env.osName} ${env.osVersion}`],
                                ['Architecture', env.osArch],
                                ['Hostname', env.hostname],
                                ['IP Address', env.hostAddress]
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between py-2 border-b border-gray-800">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-mono text-xs">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {env.disks && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Disk Space</h3>
                            <div className="space-y-4">
                                {env.disks.map((disk, i) => (
                                    <div key={i} className="p-4 bg-gray-800/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono">{disk.path}</span>
                                            <span className="text-xs text-gray-500">{disk.freeSpaceGB} GB free / {disk.totalSpaceGB} GB</span>
                                        </div>
                                        <ProgressBar value={disk.totalSpaceGB - disk.freeSpaceGB} max={disk.totalSpaceGB} color="from-orange-500 to-red-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Paths</h3>
                        <div className="space-y-2 text-xs font-mono">
                            {[
                                ['Java Home:', env.javaHome],
                                ['User Dir:', env.userDir],
                                ['Temp Dir:', env.tempDir]
                            ].map(([label, value]) => (
                                <div key={label} className="p-2 bg-gray-800/50 rounded flex gap-2">
                                    <span className="text-gray-500 w-24">{label}</span>
                                    <span className="truncate">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnostics */}
            {diag && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-400" /> Diagnostics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {[
                            ['Start Time', diag.startTime],
                            ['Classes Loaded', diag.classes?.loaded],
                            ['Total Classes', diag.classes?.totalLoaded],
                            ['Compilation Time', `${diag.compilation?.totalCompilationTimeMs} ms`]
                        ].map(([label, value]) => (
                            <div key={label} className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-gray-500 mb-1">{label}</div>
                                <div className="font-mono text-[10px]">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
