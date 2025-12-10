import API_BASE from '@/lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Database, Server, RefreshCw, Trash2, Plus,
    AlertCircle, CheckCircle, Download, Upload, Shield, Settings,
    BarChart3, Zap, HardDrive, Cpu, UserPlus, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// API helper
const api = (path) => `${API_BASE}/api${path}`;

/**
 * Admin Page - Control Panel styled like other pages
 * Features: auto-update, user management, import/export
 */
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // User creation form
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', role: 'STUDENT' });

    // Auto-refresh data every 5 seconds
    const fetchData = useCallback(async () => {
        try {
            const [statsRes, usersRes, healthRes] = await Promise.all([
                fetch(api('/admin/stats')),
                fetch(api('/admin/users')),
                fetch(api('/admin/health'))
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (healthRes.ok) setHealth(await healthRes.json());
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Auto-update every 5 seconds
        return () => clearInterval(interval);
    }, [fetchData]);

    // Show message helper
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // User management
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(api('/admin/users'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                showMessage('success', 'User created successfully');
                setNewUser({ username: '', email: '', role: 'STUDENT' });
                setShowAddUser(false);
                fetchData();
            } else {
                showMessage('error', 'Failed to create user');
            }
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(api(`/admin/users/${userId}/role`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                showMessage('success', 'Role updated');
                fetchData();
            }
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Delete this user?')) return;
        try {
            const res = await fetch(api(`/admin/users/${userId}`), { method: 'DELETE' });
            if (res.ok) {
                showMessage('success', 'User deleted');
                fetchData();
            }
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    // Export data
    const handleExport = async () => {
        try {
            const res = await fetch(api('/admin/export'));
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showMessage('success', 'Data exported');
            }
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    // Import data
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const res = await fetch(api('/admin/import'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    const result = await res.json();
                    showMessage('success', result.message);
                    fetchData();
                }
            } catch (err) {
                showMessage('error', 'Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    // Cache clear
    const handleClearCache = async () => {
        try {
            const res = await fetch(api('/admin/cache/clear'), { method: 'POST' });
            if (res.ok) {
                showMessage('success', 'Caches cleared');
                fetchData();
            }
        } catch (err) {
            showMessage('error', err.message);
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">
                                Control Panel
                            </h1>
                            <p className="text-sm text-muted-foreground/60">
                                System administration • Auto-refreshing every 5s
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                {health && (
                    <div className="flex items-center gap-4 text-sm">
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full",
                            health.status === 'UP' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                            <span className={cn("w-2 h-2 rounded-full animate-pulse", health.status === 'UP' ? "bg-emerald-400" : "bg-red-400")} />
                            System {health.status}
                        </div>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-muted-foreground/60">
                            Memory: {health.memoryMB?.used}MB / {health.memoryMB?.max}MB
                        </span>
                    </div>
                )}

                {/* Message Toast */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-3 rounded-xl flex items-center gap-2 text-sm",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 p-1 glass-panel rounded-xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats && [
                                { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                                { label: 'Courses', value: stats.totalCourses, icon: Database, color: 'text-purple-400' },
                                { label: 'Items', value: stats.totalItems, icon: Zap, color: 'text-emerald-400' },
                                { label: 'Sessions', value: stats.totalSessions, icon: BarChart3, color: 'text-orange-400' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-panel rounded-2xl p-6">
                                    <div className="flex items-center gap-2 text-muted-foreground/60 text-xs mb-2">
                                        <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                                        {stat.label}
                                    </div>
                                    <div className="text-3xl font-light">{stat.value?.toLocaleString() || '-'}</div>
                                </div>
                            ))}
                        </div>

                        {/* System Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-panel rounded-2xl p-6">
                                <h3 className="text-sm font-medium text-muted-foreground/60 mb-4 flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-cyan-400" />
                                    System Resources
                                </h3>
                                {health?.memoryMB && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground/60">Memory</span>
                                            <span>{health.memoryMB.used}MB / {health.memoryMB.max}MB</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                                                style={{ width: `${(health.memoryMB.used / health.memoryMB.max) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground/60">Java</span>
                                            <span className="font-mono text-xs">{stats?.javaVersion}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="glass-panel rounded-2xl p-6">
                                <h3 className="text-sm font-medium text-muted-foreground/60 mb-4 flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-orange-400" />
                                    Active Caches
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats?.caches && Object.keys(stats.caches).map(name => (
                                        <span key={name} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        {/* Add User Button */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-light">User Management</h2>
                            <button
                                onClick={() => setShowAddUser(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>

                        {/* Add User Modal */}
                        {showAddUser && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel rounded-2xl p-6"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium">Create New User</h3>
                                    <button onClick={() => setShowAddUser(false)}>
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input
                                        placeholder="Username"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                                        Create
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Users Table */}
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">ID</th>
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">Username</th>
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">Email</th>
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">Sessions</th>
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">Role</th>
                                        <th className="text-left px-6 py-4 font-medium text-muted-foreground/60">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-6 py-4 font-mono text-muted-foreground/60">#{user.id}</td>
                                            <td className="px-6 py-4 font-medium">{user.username}</td>
                                            <td className="px-6 py-4 text-muted-foreground/80">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs">{user.sessionCount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={cn(
                                                        "bg-transparent border rounded px-2 py-1 text-xs font-medium",
                                                        user.role === 'ADMIN' ? "border-red-400/30 text-red-400" :
                                                            user.role === 'MANAGER' ? "border-purple-400/30 text-purple-400" :
                                                                "border-blue-400/30 text-blue-400"
                                                    )}
                                                >
                                                    <option value="STUDENT">STUDENT</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-light">System Settings</h2>

                        {/* Cache Management */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground/60 mb-4 flex items-center gap-2">
                                <HardDrive className="w-4 h-4" />
                                Cache Management
                            </h3>
                            <button
                                onClick={handleClearCache}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Clear All Caches
                            </button>
                        </div>

                        {/* Import/Export */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground/60 mb-4 flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Data Management
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    Import Data
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



