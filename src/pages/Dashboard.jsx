import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, ChevronRight, Lightbulb, Trophy, Target, Zap,
    Sparkles, ArrowRight
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page';

export default function Dashboard() {
    const { courses, loading } = useCourses();
    const { stats, getStats, loading: statsLoading } = useProgress();
    const { user } = useAuth();

    useEffect(() => {
        getStats();
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
            {/* Hero Section */}
            <div className="relative mb-12 py-10 px-8 border-b border-border/40">
                <div className="max-w-3xl">
                    <h1 className="text-4xl sm:text-5xl font-serif text-primary mb-4 leading-tight">
                        {greeting()} <br />
                        <span className="text-muted-foreground opacity-60 italic">Ready to learn, {user?.username || 'friend'}?</span>
                    </h1>
                    <p className="text-xl text-muted-foreground/80 font-serif leading-relaxed max-w-xl">
                        "Language is not a genetic gift, it is a social gift. Learning a new language is becoming a member of the club - the community of speakers of that language."
                    </p>

                    <div className="mt-8 flex gap-4">
                        <Button asChild className="rounded-full px-8 bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-serif">
                            <Link to="/courses">Resume studies</Link>
                        </Button>
                        <Button asChild variant="ghost" className="rounded-full px-6 font-serif text-muted-foreground hover:text-foreground">
                            <Link to="/management">View progress</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <StatsCard
                    label="Items Studied"
                    value={stats?.totalItemsStudied}
                    icon={BookOpen}
                    color="blue"
                    loading={statsLoading}
                />
                <StatsCard
                    label="Mastered"
                    value={stats?.itemsMastered}
                    icon={Trophy}
                    color="emerald"
                    loading={statsLoading}
                />
                <StatsCard
                    label="Accuracy"
                    value={`${stats?.accuracyPercent || 0}%`}
                    icon={Target}
                    color="violet"
                    loading={statsLoading}
                />
                <StatsCard
                    label="Reviews Due"
                    value={stats?.itemsDueForReview}
                    img={stats?.itemsDueForReview > 0 ? "🔥" : null}
                    icon={Zap}
                    color="orange"
                    loading={statsLoading}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
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
                            <div className="text-center py-12">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
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
                    {/* Daily Tip */}
                    {/* Daily Insight */}
                    <div className="bg-secondary/30 rounded-xl p-6 border border-border/50">
                        <div className="flex items-start gap-4">
                            <div className="p-2 text-primary/70">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-foreground mb-2">A thought for today</h3>
                                <p className="text-muted-foreground leading-relaxed font-serif italic text-lg">
                                    "Chiri mo tsumoreba yama to naru."
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Even dust, when piled up, becomes a mountain. small steps matter.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions or Upsell */}
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                        <h3 className="font-bold text-lg mb-2">Need more words?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Import your Anki decks to keep all your study materials in one place.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/management">Import Anki Deck</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

function StatsCard({ label, value, icon: Icon, color, loading, img }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
        violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400",
        orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    };

    return (
        <div className="group relative overflow-hidden bg-card hover:bg-accent/50 transition-colors border p-5 rounded-2xl">
            <div className="flex flex-col h-full justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {loading ? '...' : value || 0}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{label}</div>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course }) {
    return (
        <Link
            to={`/courses/${course.id}`}
            className="group flex items-center gap-5 p-5 bg-card hover:bg-card/50 border hover:border-primary/30 transition-all rounded-2xl shadow-sm hover:shadow-md"
        >
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-2xl font-bold text-gray-400 group-hover:from-primary/20 group-hover:to-violet-500/20 group-hover:text-primary transition-all">
                {course.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                    {course.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-1">
                    {course.description || 'Master Japanese vocabulary and grammar.'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                    <span className="bg-secondary px-2 py-0.5 rounded-md">JLPT {course.level || 'N5'}</span>
                    <span>12 Topics</span>
                    <span>•</span>
                    <span>248 Words</span>
                </div>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full bg-secondary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
                <ChevronRight className="h-5 w-5" />
            </div>
        </Link>
    );
}

function EmptyState() {
    return (
        <div className="py-16 text-center space-y-4 border border-dashed border-border/60 rounded-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary/60" />
            </div>
            <div className="max-w-sm mx-auto">
                <h3 className="text-xl font-serif text-foreground mb-2">The beginning of a library</h3>
                <p className="text-muted-foreground">
                    The shelves are waiting. Create a course or import a deck to fill this space with knowledge.
                </p>
            </div>
            <Button asChild variant="outline" className="mt-4 rounded-full border-primary/20 hover:border-primary/50 text-foreground">
                <Link to="/management">Create first course</Link>
            </Button>
        </div>
    );
}

