import API_BASE from '@/lib/api';
import React, { useState, useEffect } from 'react';
import {
    Activity, Users, Database, Server, RefreshCw, Trash2,
    Terminal, ChevronRight, AlertCircle, CheckCircle, Clock,
    HardDrive, Cpu, Zap, Shield, Settings, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// API helper
const api = (path) => `${API_BASE}/api${path}`;

/**
 * Technical Control Panel - Manager/Admin interface
 * Dark-themed, data-centric administrative dashboard
 */
const ControlPanel = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [systemStats, setSystemStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [health, setHealth] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionStatus, setActionStatus] = useState(null);

    // Fetch all admin data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, healthRes] = await Promise.all([
                fetch(api('/admin/stats')),
                fetch(api('/admin/users')),
                fetch(api('/admin/health'))
            ]);

            if (statsRes.ok) setSystemStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (healthRes.ok) setHealth(await healthRes.json());

            // Add fetch to logs
            addLog('INFO', 'Data refresh completed');
        } catch (err) {
            addLog('ERROR', `Failed to fetch data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        addLog('SYSTEM', 'Control Panel initialized');
    }, []);

    // Log helper
    const addLog = (level, message) => {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setLogs(prev => [{ timestamp, level, message }, ...prev].slice(0, 100));
    };

    // Cache clear handler
    const handleClearCache = async (cacheName = null) => {
        const endpoint = cacheName
            ? api(`/admin/cache/clear/${cacheName}`)
            : api('/admin/cache/clear');

        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setActionStatus({ type: 'success', message: data.message });
                addLog('ACTION', data.message);
                fetchData();
            }
        } catch (err) {
            setActionStatus({ type: 'error', message: err.message });
            addLog('ERROR', `Cache clear failed: ${err.message}`);
        }
    };

    // Role change handler
    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(api(`/admin/users/${userId}/role`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                addLog('ACTION', `User ${userId} role changed to ${newRole}`);
                fetchData();
            }
        } catch (err) {
            addLog('ERROR', `Role change failed: ${err.message}`);
        }
    };

    const tabs = [
        { id: 'DASHBOARD', label: 'System', icon: Activity },
        { id: 'USERS', label: 'Users', icon: Users },
        { id: 'CONTROLS', label: 'Controls', icon: Settings },
        { id: 'LOGS', label: 'Logs', icon: Terminal },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 font-mono overflow-hidden flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
                        <Shield className="w-4 h-4 text-slate-900" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Control Panel</h1>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Admin Interface v2.1</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    {health && (
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded text-xs",
                            health.status === 'UP' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                            <span className={cn("w-2 h-2 rounded-full", health.status === 'UP' ? "bg-emerald-400" : "bg-red-400")} />
                            {health.status}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                    >
                        Exit
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <nav className="w-48 border-r border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all text-left",
                                activeTab === tab.id
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'DASHBOARD' && (
                            <DashboardTab stats={systemStats} health={health} loading={loading} />
                        )}
                        {activeTab === 'USERS' && (
                            <UsersTab users={users} onRoleChange={handleRoleChange} loading={loading} />
                        )}
                        {activeTab === 'CONTROLS' && (
                            <ControlsTab
                                caches={systemStats?.caches}
                                onClearCache={handleClearCache}
                                actionStatus={actionStatus}
                            />
                        )}
                        {activeTab === 'LOGS' && (
                            <LogsTab logs={logs} />
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Status Bar */}
            <footer className="border-t border-slate-800 px-6 py-2 bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
                <span>Connected to localhost:8080</span>
                <span>{new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
            </footer>
        </div>
    );
};

// Dashboard Tab
const DashboardTab = ({ stats, health, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
    >
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            System Dashboard
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats && [
                { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Courses', value: stats.totalCourses, icon: Database, color: 'text-purple-400' },
                { label: 'Topics', value: stats.totalTopics, icon: BarChart3, color: 'text-orange-400' },
                { label: 'Items', value: stats.totalItems, icon: Zap, color: 'text-emerald-400' },
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                        <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                        {stat.label}
                    </div>
                    <div className="text-2xl font-bold">{stat.value?.toLocaleString() || '-'}</div>
                </div>
            ))}
        </div>

        {/* Memory & Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memory */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Memory Usage
                </h3>
                {health?.memoryMB && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Used</span>
                            <span>{health.memoryMB.used} MB / {health.memoryMB.max} MB</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${(health.memoryMB.used / health.memoryMB.max) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* System Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    System Info
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Java</span>
                        <span className="font-mono">{stats?.javaVersion || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Database</span>
                        <span className={cn("font-mono", health?.database === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400')}>
                            {health?.database || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Sessions</span>
                        <span className="font-mono">{stats?.totalSessions?.toLocaleString() || '-'}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Cache Status */}
        {stats?.caches && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-400" />
                    Active Caches
                </h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.caches).map(([name, status]) => (
                        <div key={name} className="px-3 py-1.5 bg-slate-800 rounded text-xs flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {name}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </motion.div>
);

// Users Tab
const UsersTab = ({ users, onRoleChange, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
    >
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            User Management
            <span className="text-sm font-normal text-slate-500 ml-2">({users.length} total)</span>
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Username</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Sessions</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-mono text-slate-500">#{user.id}</td>
                            <td className="px-4 py-3 font-medium">{user.username}</td>
                            <td className="px-4 py-3 text-slate-400">{user.email}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">{user.sessionCount}</span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-bold",
                                    user.role === 'ADMIN' ? "bg-red-500/20 text-red-400" :
                                        user.role === 'MANAGER' ? "bg-purple-500/20 text-purple-400" :
                                            "bg-blue-500/20 text-blue-400"
                                )}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <select
                                    value={user.role}
                                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </motion.div>
);

// Controls Tab
const ControlsTab = ({ caches, onClearCache, actionStatus }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
    >
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            System Controls
        </h2>

        {actionStatus && (
            <div className={cn(
                "p-3 rounded flex items-center gap-2 text-sm",
                actionStatus.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
                {actionStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {actionStatus.message}
            </div>
        )}

        {/* Cache Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Cache Management
            </h3>

            <div className="space-y-3">
                <button
                    onClick={() => onClearCache()}
                    className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear All Caches
                </button>

                {caches && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                        {Object.keys(caches).map(name => (
                            <button
                                key={name}
                                onClick={() => onClearCache(name)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center justify-between gap-2 transition-colors"
                            >
                                <span>{name}</span>
                                <RefreshCw className="w-3 h-3 text-slate-500" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Data Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Operations
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                    <span>Export Data (JSON)</span>
                </button>
                <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                    <span>Anki Import</span>
                </button>
            </div>
        </div>
    </motion.div>
);

// Logs Tab
const LogsTab = ({ logs }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-4"
    >
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-400" />
            Activity Logs
        </h2>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs h-[calc(100vh-280px)] overflow-auto">
            {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-8">No logs yet</div>
            ) : (
                <div className="space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-3 hover:bg-slate-900/50 px-2 py-1 rounded">
                            <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                            <span className={cn(
                                "shrink-0 w-16",
                                log.level === 'ERROR' ? 'text-red-400' :
                                    log.level === 'ACTION' ? 'text-cyan-400' :
                                        log.level === 'SYSTEM' ? 'text-purple-400' :
                                            'text-slate-400'
                            )}>
                                [{log.level}]
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </motion.div>
);

export default ControlPanel;



