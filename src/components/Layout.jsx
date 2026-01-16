import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    BookOpen, Home, Search, Settings,
    PanelLeftClose, PanelLeftOpen, Menu, X,
    LogOut, User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Layout() {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { label: 'Dashboard', path: '/', icon: Home },
        { label: 'Courses', path: '/courses', icon: BookOpen },

        { label: 'Management', path: '/management', icon: Settings }, // Explicitly added Management/Manage back
    ];

    // Mobile Menu Portal
    const MobileMenu = () => {
        if (typeof document === 'undefined') return null;
        return createPortal(
            isMobileMenuOpen ? (
                <>
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-[280px] z-50 md:hidden bg-background border-r p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-xl text-primary tracking-tight">Manage</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-secondary text-primary"
                                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4 border-t space-y-2">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-3 px-2"
                                        onClick={logout}
                                    >
                                        <LogOut className="h-5 w-5 text-muted-foreground" />
                                        Sign out
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Link to="/login" className="w-full">
                                        <Button variant="outline" className="w-full justify-start gap-3">
                                            <UserIcon className="h-4 w-4" />
                                            Log in
                                        </Button>
                                    </Link>
                                    <Link to="/signup" className="w-full">
                                        <Button className="w-full justify-start gap-3">
                                            <UserIcon className="h-4 w-4" />
                                            Sign up
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : null,
            document.body
        );
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Menu */}
            <MobileMenu />

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
                    isCollapsed ? "w-[60px]" : "w-[240px]"
                )}
            >
                <div className="h-14 flex items-center px-4 border-b border-border/40">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 ml-1">
                            {/* Plain text 'Manage' as requested */}
                            <span className="font-serif font-bold text-2xl text-primary tracking-tight">Manage</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("ml-auto h-8 w-8 text-muted-foreground", isCollapsed && "mx-auto")}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const label = item.label === 'Management' ? 'Manage' : item.label;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? label : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors group relative", // Increased to py-3 and text-base
                                    isActive
                                        ? "bg-secondary text-primary font-bold"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                                {!isCollapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-2 border-t border-border/40 space-y-1">
                    {user ? (
                        <>
                            <div className={cn(
                                "flex items-center gap-2 p-2 rounded-lg transition-colors",
                                isCollapsed ? "justify-center" : "px-3"
                            )}>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm font-medium truncate text-foreground">{user.username}</p>
                                        <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 px-3",
                                    isCollapsed && "justify-center px-2"
                                )}
                                onClick={logout}
                                title="Sign out"
                            >
                                <LogOut className="h-5 w-5 shrink-0 text-muted-foreground" />
                                {!isCollapsed && <span>Sign out</span>}
                            </Button>
                        </>
                    ) : (
                        <div className={cn("space-y-2", isCollapsed && "flex flex-col items-center space-y-2")}>
                            <Link to="/login" className="w-full">
                                <Button variant="outline" className={cn("w-full justify-start gap-3", isCollapsed && "justify-center px-0")}>
                                    <UserIcon className="h-4 w-4" />
                                    {!isCollapsed && "Log in"}
                                </Button>
                            </Link>
                            <Link to="/signup" className="w-full">
                                <Button className={cn("w-full justify-start gap-3", isCollapsed && "justify-center px-0")}>
                                    <UserIcon className="h-4 w-4" />
                                    {!isCollapsed && "Sign up"}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden h-14 border-b flex items-center px-4 bg-background sticky top-0 z-20">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-serif font-bold text-xl text-primary ml-2 tracking-tight">Manage</span>
                </header>

                <main className="flex-1 px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


