import React, { useState, useEffect, useCallback } from 'react';
import { Database, HardDrive, Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

const api = (path) => `http://localhost:8080/api${path}`;

/**
 * Admin Database Page - Database stats, backup, and data operations
 */
export default function AdminDatabase() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [backup, setBackup] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const headers = { 'X-User-Id': user.id.toString() };

        try {
            const [statsRes, backupRes] = await Promise.all([
                fetch(api('/admin/database/stats'), { headers }),
                fetch(api('/admin/backup/summary'), { headers })
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (backupRes.ok) setBackup(await backupRes.json());
        } catch (err) {
            console.error('Failed to fetch:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [fetchData, user]);

    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleExport = async () => {
        if (!user) return;
        try {
            const res = await fetch(api('/admin/export'), {
                headers: { 'X-User-Id': user.id.toString() }
            });
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showToast('success', 'Database exported successfully');
            } else {
                showToast('error', 'Export failed');
            }
        } catch (err) {
            showToast('error', err.message);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const res = await fetch(api('/admin/import'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': user.id.toString()
                    },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    const result = await res.json();
                    showToast('success', result.message);
                    fetchData();
                } else {
                    showToast('error', 'Import failed');
                }
            } catch (err) {
                showToast('error', 'Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const StatBox = ({ label, value }) => (
        <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-xl font-light">{value?.toLocaleString() ?? '—'}</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-light tracking-tight">Database Management</h1>
                <p className="text-xs text-gray-500 mt-1">Backup, restore, and statistics</p>
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

            {/* Database Stats */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Entity Counts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatBox label="Users" value={stats?.users} />
                    <StatBox label="Courses" value={stats?.courses} />
                    <StatBox label="Topics" value={stats?.topics} />
                    <StatBox label="Items" value={stats?.items} />
                    <StatBox label="Sessions" value={stats?.sessions} />
                </div>
            </div>

            {/* Storage */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-400" />
                    Storage
                </h3>
                <div className="text-3xl font-light mb-2">{stats?.estimatedStorageKB ?? 0} KB</div>
                <p className="text-xs text-gray-500">Estimated database size</p>
            </div>

            {/* Backup Operations */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Backup & Restore</h3>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm text-blue-400 flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Database
                    </button>
                    <label className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Import Data
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                </div>
                {backup && (
                    <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                        Last backup: {backup.lastBackup} • Generated: {new Date(backup.generatedAt).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
}
