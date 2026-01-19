import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    BookOpen, Home, Settings,
    PanelLeftClose, PanelLeftOpen, Menu, X,
    LogOut, User as UserIcon, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button, buttonVariants } from '@/components/ui/button';

export default function Layout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
        { label: 'Workspace', path: '/management', icon: Settings },
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
                                <span className="font-serif font-bold text-xl text-primary tracking-tight">Workspace</span>
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

                        {/* Mobile Theme Toggle */}
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 px-3 mt-4"
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                            ) : (
                                <Moon className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </Button>

                        <div className="mt-auto pt-4 border-t space-y-2">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.displayName}</p>
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
                    "hidden md:flex flex-col border-r border-border/50 bg-background h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
                    isCollapsed ? "w-[68px]" : "w-[230px]"
                )}
            >
                <div className="h-14 flex items-center px-4 border-b border-border/50">
                    {!isCollapsed && (
                        <span className="font-serif font-bold text-lg text-primary tracking-tight">Workspace</span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("ml-auto h-8 w-8 text-muted-foreground", isCollapsed && "mx-auto")}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const label = item.label;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} title={isCollapsed ? label : undefined}>
                                <div
                                    data-active={isActive}
                                    className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        "w-full justify-start gap-3 text-sm px-3",
                                        isCollapsed && "justify-center px-2",
                                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border data-[active=true]:border-primary/30"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                    {!isCollapsed && <span>{label}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-border/40 space-y-2">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 px-3 text-sm",
                            isCollapsed && "justify-center px-2"
                        )}
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                            <Moon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </Button>

                    {user ? (
                        <>
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-2 rounded-lg",
                                isCollapsed ? "justify-center" : ""
                            )}>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm font-medium truncate text-foreground">{user.displayName}</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 px-3 text-sm",
                                    isCollapsed && "justify-center px-2"
                                )}
                                onClick={logout}
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                                {!isCollapsed && <span>Sign out</span>}
                            </Button>
                        </>
                    ) : (
                        <div className={cn("space-y-2", isCollapsed && "flex flex-col items-center space-y-2")}> 
                            <Link to="/login" className="w-full">
                                <Button variant="outline" className={cn("w-full justify-start gap-3 text-sm", isCollapsed && "justify-center px-0")}> 
                                    <UserIcon className="h-4 w-4" />
                                    {!isCollapsed && "Log in"}
                                </Button>
                            </Link>
                            <Link to="/signup" className="w-full">
                                <Button className={cn("w-full justify-start gap-3 text-sm", isCollapsed && "justify-center px-0")}> 
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
                    <span className="font-serif font-bold text-xl text-primary ml-2 tracking-tight">Workspace</span>
                </header>

                <main className="flex-1 px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


