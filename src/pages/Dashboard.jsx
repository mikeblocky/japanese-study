import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, ChevronRight, Lightbulb, Trophy, Target, Zap, ArrowRight, Sparkles
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page';

const QUOTES = [
    { text: "Language is not a genetic gift, it is a social gift.", author: "Frank Smith" },
    { text: "With languages, you are at home anywhere.", author: "Edmund de Waal" },
    { text: "A different language is a different vision of life.", author: "Federico Fellini" },
    { text: "Learning another language is not only learning different words for the same things, but learning another way of thinking about things.", author: "Flora Lewis" },
    { text: "Change your language and you change your thoughts.", author: "Karl Albrecht" },
    { text: "千里の道も一歩から (A journey of a thousand miles begins with a single step).", author: "Japanese Proverb" },
    { text: "塵も積もれば山となる (Even dust, when piled up, becomes a mountain).", author: "Japanese Proverb" },
    { text: "七転び八起き (Fall down seven times, stand up eight).", author: "Japanese Proverb" },
    { text: "石の上にも三年 (Three years on a stone / Perseverance prevails).", author: "Japanese Proverb" },
];

export default function Dashboard() {
    const { courses, loading } = useCourses();
    const { stats, getStats, loading: statsLoading } = useProgress();
    const { user } = useAuth();
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        getStats();
        // Randomize quote on mount
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, [getStats]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return 'The early quiet.';
        if (hour < 12) return 'Good morning.';
        if (hour < 18) return 'Good afternoon.';
        return 'The evening calm.';
    };

    return (
        <PageShell className="pb-20">
            {/* Hero Section */}
            <div className="relative mb-10 py-8 px-6 sm:px-10 border-b border-border/40">
                <div className="max-w-3xl">
                    <h1 className="text-4xl sm:text-5xl font-serif text-primary mb-6 leading-tight">
                        {greeting()} <br />
                        <span className="text-muted-foreground opacity-60 italic text-2xl sm:text-3xl">Ready for today's session, {user?.username}?</span>
                    </h1>

                    <div className="bg-secondary/30 p-6 rounded-xl border border-secondary relative overflow-hidden">
                        <Sparkles className="absolute top-4 right-4 h-12 w-12 text-primary/5 opacity-50" />
                        <p className="text-lg text-foreground/90 font-serif italic mb-3 relative z-10 transition-all duration-500">
                            "{quote.text}"
                        </p>
                        <p className="text-sm text-primary/60 font-medium relative z-10">— {quote.author}</p>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <Button asChild className="rounded-full px-8 bg-primary text-primary-foreground hover:opacity-90 font-medium h-12">
                            <Link to="/courses">Resume studies</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-6 h-12 border-red-500/20 text-red-600 hover:bg-red-500/5 hover:text-red-700">
                            <Link to="/study/challenge" className="flex items-center gap-2">
                                <Zap className="h-4 w-4 fill-current" /> Challenge
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-6 h-12 border-primary/20 hover:bg-primary/5">
                            <Link to="/management">View stats</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="px-6 sm:px-10 mb-12">
                <div className="max-w-xs">
                    <StatsCard
                        label="Total Items Studied"
                        value={stats?.totalItemsStudied}
                        icon={BookOpen}
                        color="blue"
                        loading={statsLoading}
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 px-6 sm:px-10">
                {/* Course List - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Current Courses</h2>
                        <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                            <Link to="/courses" className="flex items-center gap-1">
                                View Library <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-24 rounded-2xl bg-secondary/30 animate-pulse" />
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <EmptyState />
                        ) : (
                            courses.slice(0, 3).map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions / Import Upsell */}
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                        <div className="flex items-center gap-3 mb-3 text-primary">
                            <Lightbulb className="h-5 w-5" />
                            <h3 className="font-bold text-lg">Expand your library</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Have existing Anki decks? Import them to keep all your progress in one place.
                        </p>
                        <Button asChild variant="outline" className="w-full bg-background/50 hover:bg-background border-primary/20">
                            <Link to="/management?tab=import">Import Deck</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

function StatsCard({ label, value, icon: Icon, color, loading }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
        violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400",
        orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    };

    return (
        <div className="relative overflow-hidden bg-card hover:bg-accent/50 transition-all duration-300 border p-5 rounded-2xl shadow-sm hover:shadow">
            <div className="flex flex-col h-full justify-between gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-3xl font-bold tracking-tight text-foreground font-mono">
                        {loading ? <span className="animate-pulse opacity-50">--</span> : value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</div>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course }) {
    return (
        <Link
            to={`/courses/${course.id}`}
            className="group flex items-center gap-5 p-5 bg-card hover:bg-accent/30 border hover:border-primary/30 transition-all rounded-2xl shadow-sm hover:shadow-md"
        >
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xl font-bold text-gray-400 group-hover:from-primary/10 group-hover:to-violet-500/10 group-hover:text-primary transition-all">
                {course.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                    {course.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-1">
                    {course.description || 'Master Japanese vocabulary and grammar.'}
                </p>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-secondary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                <ChevronRight className="h-4 w-4" />
            </div>
        </Link>
    );
}

function EmptyState() {
    return (
        <div className="py-12 text-center space-y-4 border border-dashed border-border/60 rounded-xl bg-muted/5">
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary/60" />
            </div>
            <div className="max-w-xs mx-auto">
                <h3 className="text-lg font-serif text-foreground mb-1">Start your journey</h3>
                <p className="text-sm text-muted-foreground">
                    Create a course or import a deck to begin learning.
                </p>
            </div>
            <Button asChild size="sm" className="rounded-full">
                <Link to="/management">Create Course</Link>
            </Button>
        </div>
    );
}

