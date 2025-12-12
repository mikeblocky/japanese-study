import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { BookOpen, Home, Menu, User as UserIcon, Search, X, Settings, Cog } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { label: 'Dashboard', path: '/', icon: Home },
        { label: 'Courses', path: '/courses', icon: BookOpen },
        { label: 'Words', path: '/console', icon: Search },
        { label: 'Management', path: '/management', icon: Cog },
        { label: 'Settings', path: '/settings', icon: Settings },
    ];

    // Mobile menu portal (kept simple for a static feel)
    const MobileMenu = () => {
        if (typeof document === 'undefined') return null;

        return createPortal(
            isMobileMenuOpen ? (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-[9998] md:hidden animate-in fade-in duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-[280px] z-[9999] md:hidden flex flex-col overflow-hidden bg-background border-l shadow-xl animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-4 py-4 border-b">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="font-bold text-lg tracking-tight">mystudy</span>
                            </div>
                            <button
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                                            isActive 
                                                ? "bg-primary text-primary-foreground" 
                                                : "hover:bg-secondary text-foreground"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="border-t px-4 py-4">
                            <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{user ? user.username : 'Guest'}</div>
                                    <div className="text-xs text-muted-foreground">{user?.role || 'Visitor'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null,
            document.body
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Mobile Menu Portal */}
            <MobileMenu />

            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-10">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">mystudy</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-2 text-sm font-medium">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "relative px-4 py-2 rounded-lg transition-colors flex items-center gap-2",
                                        isActive 
                                            ? "bg-primary text-primary-foreground" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* User Profile */}
                        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 bg-secondary rounded-lg">
                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-sm font-medium">
                                {user ? user.username : 'Guest'}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto">
                <Outlet />
            </main>
        </div>
    );
}


