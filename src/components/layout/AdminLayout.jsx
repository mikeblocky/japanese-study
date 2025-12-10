import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
    Shield, LayoutDashboard, Users, Database, Settings,
    ArrowLeft, Terminal, Server, Wrench, BookOpen, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

/**
 * AdminLayout - Completely separate admin section with its own navigation
 * Dark technical theme, distinct from the main app
 */
export default function AdminLayout() {
    const location = useLocation();
    const { user } = useAuth();

    // Redirect non-admin/manager users
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
        return <Navigate to="/" replace />;
    }

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/content', label: 'Content', icon: BookOpen },
        // Technical tabs are for ADMIN only
        ...(user?.role === 'ADMIN' ? [
            { path: '/admin/monitoring', label: 'Monitoring', icon: Activity },
            { path: '/admin/database', label: 'Database', icon: Database },
            { path: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
            { path: '/admin/system', label: 'System', icon: Server },
        ] : [])
    ];

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-[#0a0a12] text-gray-100 font-mono">
            {/* Top Bar */}
            <header className="h-14 border-b border-gray-800 bg-[#0d0d18]/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="h-full px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold tracking-tight">Admin Control Center</h1>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Management</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400">System Online</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {user.username} <span className="text-purple-400">({user.role})</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <nav className="w-56 min-h-[calc(100vh-3.5rem)] border-r border-gray-800 bg-[#0d0d18]/50 p-4">
                    <div className="space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                                    isActive(item.path, item.exact)
                                        ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-800">
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-3 px-3">Quick Actions</div>
                        <Link to="/manager" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 transition-all">
                            <Terminal className="w-4 h-4" />
                            Content Manager
                        </Link>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 p-6 min-h-[calc(100vh-3.5rem)] overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
