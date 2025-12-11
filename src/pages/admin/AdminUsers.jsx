import api from '@/lib/api';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, UserPlus, Trash2, Key, RefreshCw, Upload, X,
    ChevronDown, AlertTriangle, CheckCircle, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin Users Page - Full user management with password and bulk operations
 */
export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Modals
    const [showAddUser, setShowAddUser] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(null);

    // Refs for form inputs (prevents re-renders/flickering while typing)
    const newUsernameRef = useRef(null);
    const newEmailRef = useRef(null);
    const newPasswordRef = useRef(null);
    const newRoleRef = useRef(null);
    const bulkTextRef = useRef(null);
    const changePasswordRef = useRef(null);

    // API Helper with headers
    // API Helper using axios instance
    const apiCall = useCallback(async (path, options = {}) => {
        // Axios options
        const config = { ...options };
        if (config.body) {
            config.data = JSON.parse(config.body); // Axios uses 'data', not 'body', and expects object not string if JSON
            delete config.body;
        }

        // Handle method override if passed in options
        const method = (config.method || 'GET').toLowerCase();

        return api({
            url: path,
            method,
            ...config
        });
    }, []);

    const fetchUsers = useCallback(async () => {
        // Don't refresh if user is interacting with a modal
        if (showAddUser || showBulkImport || showPasswordModal) return;

        try {
            const res = await apiCall('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [showAddUser, showBulkImport, showPasswordModal, apiCall]);

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 10000);
        return () => clearInterval(interval);
    }, [fetchUsers]);

    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // Helper: Permission check
    const canModifyUser = (targetUser) => {
        if (!currentUser) return false;
        if (currentUser.role === 'ADMIN') return true;
        // Manager can modify anyone EXCEPT Admin
        if (currentUser.role === 'MANAGER') {
            return targetUser.role !== 'ADMIN';
        }
        return false;
    };

    // Create single user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        const username = newUsernameRef.current?.value;
        const email = newEmailRef.current?.value;
        const password = newPasswordRef.current?.value || 'changeme';
        const role = newRoleRef.current?.value || 'STUDENT';

        try {
            await apiCall('/admin/users', {
                method: 'POST',
                data: { username, email, password, role }
            });
            showToast('success', 'User created');
            setShowAddUser(false);
            fetchUsers();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to create user');
        }
    };

    // Bulk import
    const handleBulkImport = async () => {
        const text = bulkTextRef.current?.value || '';
        try {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const usersData = lines.map(line => {
                const [username, email, role = 'STUDENT', password = 'changeme'] = line.split(',').map(s => s.trim());
                return { username, email, role, password };
            });

            const res = await apiCall('/admin/users/bulk', {
                method: 'POST',
                data: usersData
            });

            const result = res.data;
            showToast('success', `Created ${result.created} users`);
            setShowBulkImport(false);
            fetchUsers();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    // Update password
    const handleUpdatePassword = async () => {
        const password = changePasswordRef.current?.value;
        if (!password || password.length < 4) {
            showToast('error', 'Password must be at least 4 characters');
            return;
        }
        try {
            await apiCall(`/admin/users/${showPasswordModal}/password`, {
                method: 'PATCH',
                data: { password }
            });
            showToast('success', 'Password updated');
            setShowPasswordModal(null);
        } catch (err) {
            showToast('error', err.message);
        }
    };

    // Update role
    const handleRoleChange = async (userId, newRole) => {
        try {
            await apiCall(`/admin/users/${userId}/role`, {
                method: 'PATCH',
                data: { role: newRole }
            });
            showToast('success', 'Role updated');
            // Force immediate refresh for specific row update
            fetchUsers();
        } catch (err) {
            showToast('error', err.message);
            fetchUsers(); // Revert UI
        }
    };

    // Delete user
    const handleDeleteUser = async (userId) => {
        if (!confirm('Permanently delete this user and all their data?')) return;
        try {
            await apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
            showToast('success', 'User deleted');
            fetchUsers();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    // Reset progress
    const handleResetProgress = async (userId) => {
        if (!confirm('Reset all study progress for this user? This cannot be undone.')) return;
        try {
            await apiCall(`/admin/users/${userId}/reset-progress`, { method: 'POST' });
            showToast('success', 'Progress reset');
            fetchUsers();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    const Modal = ({ title, children, onClose }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light tracking-tight">User Management</h1>
                    <p className="text-xs text-gray-500 mt-1">{users.length} registered users</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkImport(true)}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs flex items-center gap-2 transition-colors"
                    >
                        <Upload className="w-3 h-3" />
                        Bulk Import
                    </button>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs flex items-center gap-2 transition-colors"
                    >
                        <UserPlus className="w-3 h-3" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "p-3 rounded-lg flex items-center gap-2 text-sm",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 bg-gray-900/50">
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ID</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Username</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Email</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sessions</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Role</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const canEdit = canModifyUser(user);
                            return (
                                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{user.id}</td>
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        {user.username}
                                        {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-red-400" />}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">{user.sessionCount}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={!canEdit}
                                            className={cn(
                                                "bg-transparent border rounded px-2 py-1 text-xs font-medium",
                                                !canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                                user.role === 'ADMIN' ? "border-red-500/30 text-red-400" :
                                                    user.role === 'MANAGER' ? "border-purple-500/30 text-purple-400" :
                                                        "border-blue-500/30 text-blue-400"
                                            )}
                                        >
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="MANAGER">MANAGER</option>
                                            {/* Only show ADMIN option if allowed */}
                                            {currentUser?.role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                                            {/* Keep ADMIN option visible if user is already ADMIN, even if disabled */}
                                            {user.role === 'ADMIN' && currentUser?.role !== 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setShowPasswordModal(user.id)}
                                                disabled={!canEdit}
                                                className={cn(
                                                    "p-1.5 rounded",
                                                    !canEdit ? "text-gray-700 cursor-not-allowed" : "text-gray-500 hover:bg-gray-800 hover:text-yellow-400"
                                                )}
                                                title="Change Password"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleResetProgress(user.id)}
                                                className="p-1.5 hover:bg-gray-800 rounded text-gray-500 hover:text-orange-400"
                                                title="Reset Progress"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={!canEdit}
                                                className={cn(
                                                    "p-1.5 rounded",
                                                    !canEdit ? "text-gray-700 cursor-not-allowed" : "text-gray-500 hover:bg-gray-800 hover:text-red-400"
                                                )}
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showAddUser && (
                    <Modal title="Create New User" onClose={() => setShowAddUser(false)}>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input
                                ref={newUsernameRef}
                                placeholder="Username"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                required
                            />
                            <input
                                ref={newEmailRef}
                                type="email"
                                placeholder="Email"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                required
                            />
                            <input
                                ref={newPasswordRef}
                                type="password"
                                placeholder="Password (default: changeme)"
                                defaultValue="changeme"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                            />
                            <select
                                ref={newRoleRef}
                                defaultValue="STUDENT"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="STUDENT">Student</option>
                                <option value="MANAGER">Manager</option>
                                {currentUser?.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
                            </select>
                            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 rounded-lg py-2 text-sm font-medium">
                                Create User
                            </button>
                        </form>
                    </Modal>
                )}

                {showBulkImport && (
                    <Modal title="Bulk Import Users" onClose={() => setShowBulkImport(false)}>
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500">Format: username, email, role, password (one per line)</p>
                            <textarea
                                ref={bulkTextRef}
                                placeholder="john, john@example.com, STUDENT, pass123&#10;jane, jane@example.com, MANAGER"
                                className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono resize-none"
                            />
                            <button
                                onClick={handleBulkImport}
                                className="w-full bg-violet-600 hover:bg-violet-500 rounded-lg py-2 text-sm font-medium"
                            >
                                Import Users
                            </button>
                        </div>
                    </Modal>
                )}

                {showPasswordModal && (
                    <Modal title="Change Password" onClose={() => setShowPasswordModal(null)}>
                        <div className="space-y-4">
                            <input
                                ref={changePasswordRef}
                                type="password"
                                placeholder="New password (min 4 chars)"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                onClick={handleUpdatePassword}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 rounded-lg py-2 text-sm font-medium"
                            >
                                Update Password
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}



