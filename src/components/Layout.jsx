import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { BookOpen, Home, BarChart3, Menu, User as UserIcon, Search, Layers, X, Settings } from 'lucide-react';
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
        // Conditional Manager Link
        ...((user?.role === 'MANAGER' || user?.role === 'ADMIN') ? [{ label: 'Manager', path: '/manager', icon: Layers }] : []),
        { label: 'Stats', path: '/stats', icon: BarChart3 },
        { label: 'Settings', path: '/settings', icon: Settings },
    ];

    // Liquid Glass spring animation config
    const liquidSpring = {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
    };

    const menuItemVariants = {
        hidden: { x: -30, opacity: 0, scale: 0.95 },
        visible: (i) => ({
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                delay: i * 0.06,
                ...liquidSpring
            }
        }),
        exit: { x: -20, opacity: 0, transition: { duration: 0.2 } }
    };

    // Mobile Menu Portal Component with Liquid Glass effect
    const MobileMenu = () => {
        if (typeof document === 'undefined') return null;

        return createPortal(
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/10 z-[9998] md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: "-10%", scale: 0.98 }}
                            animate={{ opacity: 1, x: "0%", scale: 1 }}
                            exit={{ opacity: 0, x: "-5%", scale: 0.98 }}
                            transition={{ ...liquidSpring, duration: 0.4 }}
                            className="fixed inset-0 bg-white/[0.97] dark:bg-zinc-950/[0.97] backdrop-blur-2xl backdrop-saturate-150 z-[9999] md:hidden flex flex-col overflow-hidden"
                        >
                            {/* Liquid Glass Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/[0.02] pointer-events-none" />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            {/* Header with close button */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, ...liquidSpring }}
                                className="relative flex items-center justify-between px-6 py-6 border-b border-border/20"
                            >
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-2xl tracking-tight">
                                    Japanese<span className="font-normal text-muted-foreground/80">Study</span>
                                </Link>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={liquidSpring}
                                    className="p-2.5 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors shadow-liquid"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </motion.div>

                            {/* Navigation Links */}
                            <div className="relative flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                                {navItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <motion.div
                                            key={item.path}
                                            custom={idx}
                                            variants={menuItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                        >
                                            <Link
                                                to={item.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn(
                                                    "group flex items-center gap-4 py-4 px-5 rounded-2xl text-lg font-light tracking-tight transition-all duration-300",
                                                    isActive
                                                        ? "bg-gradient-to-r from-primary/10 to-primary/5 text-foreground font-medium shadow-liquid"
                                                        : "text-foreground/60 hover:text-foreground hover:bg-secondary/40 active:scale-[0.98]"
                                                )}
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                                    transition={liquidSpring}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-colors",
                                                        isActive ? "bg-primary/10" : "bg-secondary/30 group-hover:bg-secondary/50"
                                                    )}
                                                >
                                                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                                </motion.div>
                                                {item.label}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeIndicator"
                                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                                        transition={liquidSpring}
                                                    />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* User Section */}
                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, ...liquidSpring }}
                                className="relative px-4 py-5 border-t border-border/20 bg-gradient-to-t from-secondary/20 to-transparent"
                            >
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/30 shadow-liquid">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={liquidSpring}
                                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-primary/10 flex items-center justify-center shadow-inner"
                                    >
                                        <UserIcon className="w-5 h-5 text-foreground/60" />
                                    </motion.div>
                                    <div className="flex-1">
                                        <div className="font-medium">{user ? user.username : 'Guest'}</div>
                                        <div className="text-xs text-muted-foreground">{user?.role || 'Visitor'}</div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
            {/* Mobile Menu Portal */}
            <MobileMenu />

            {/* Top Navbar - Liquid Glass */}
            <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/30">
                <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <motion.span
                            whileHover={{ scale: 1.02 }}
                            transition={liquidSpring}
                            className="font-bold text-2xl tracking-tight"
                        >
                            Japanese<span className="font-normal text-muted-foreground/80">Study</span>
                        </motion.span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-2 text-sm font-medium bg-secondary/30 p-1.5 rounded-2xl">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "relative px-4 py-2 rounded-xl transition-all duration-300",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-pill"
                                            className="absolute inset-0 bg-background rounded-xl shadow-liquid"
                                            transition={liquidSpring}
                                        />
                                    )}
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* User Profile */}
                        <div className="hidden md:flex items-center gap-3 p-1.5 pr-4 bg-secondary/30 rounded-2xl">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={liquidSpring}
                                className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center"
                            >
                                <UserIcon className="w-4 h-4 text-foreground/70" />
                            </motion.div>
                            <div className="text-sm font-medium">
                                {user ? user.username : 'Guest'}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={liquidSpring}
                            className="md:hidden p-2.5 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors shadow-liquid"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12 lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}
