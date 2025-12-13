import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Play, Search, Settings, Zap, TrendingUp, ChevronRight, Lightbulb, Star, Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/ui/page';

export default function Dashboard() {
    const [dueCount, setDueCount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [wordOfDay, setWordOfDay] = useState(null);
    const [localLoading, setLocalLoading] = useState(true);

    // Use custom hook for courses - eliminates duplicated code!
    const { courses, loading: coursesLoading } = useCourses();

    const loading = localLoading || coursesLoading;

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [dueRes, itemsRes] = await Promise.allSettled([
                    api.get('/study/items/due'),
                    api.get('/study/items')
                ]);

                if (!cancelled && dueRes.status === 'fulfilled' && Array.isArray(dueRes.value.data)) {
                    setDueCount(dueRes.value.data.length);
                }
                if (!cancelled && itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value.data)) {
                    const items = itemsRes.value.data;
                    setTotalItems(items.length);
                    // Pick a "word of the day" based on current date as seed
                    if (items.length > 0) {
                        const today = new Date();
                        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
                        const index = seed % items.length;
                        setWordOfDay(items[index]);
                    }
                }
            } catch (err) {
                console.error('Dashboard fetch failed', err);
            } finally {
                if (!cancelled) setLocalLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <PageShell>
            {/* Greeting Header */}
            <div className="mb-5 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {greeting()} 👋
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                    Ready to continue learning?
                </p>
            </div>

            {/* Hero Review Card */}
            <Card className="mb-4 sm:mb-6 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {dueCount > 0 ? (
                                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            ) : (
                                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-xl font-bold">
                                    {loading ? 'Loading...' : dueCount > 0 ? `${dueCount} cards due` : 'All caught up!'}
                                </h2>
                                {dueCount > 0 && (
                                    <Badge variant="secondary" className="h-5 text-xs hidden sm:flex">
                                        <Zap className="mr-1 h-3 w-3" />
                                        Ready
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-1">
                                {dueCount > 0
                                    ? 'Start reviewing to strengthen memory'
                                    : 'Great job! All reviews done 🎉'}
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild={dueCount > 0}
                        disabled={dueCount === 0 || loading}
                        size="lg"
                        className="w-full mt-4 h-11 sm:h-12 text-sm sm:text-base font-semibold"
                    >
                        {dueCount > 0 ? (
                            <Link to="/study/review" className="gap-2">
                                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                Start review
                            </Link>
                        ) : (
                            <span>All done</span>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardContent className="p-2.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            </div>
                            <div className="text-center sm:text-left min-w-0">
                                <p className="text-base sm:text-xl font-bold">{loading ? '...' : dueCount}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Due</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-2.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                            </div>
                            <div className="text-center sm:text-left min-w-0">
                                <p className="text-base sm:text-xl font-bold">{loading ? '...' : totalItems}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Cards</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                    <CardContent className="p-2.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            </div>
                            <div className="text-center sm:text-left min-w-0">
                                <p className="text-base sm:text-xl font-bold">{loading ? '...' : courses.length}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Courses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Word of the Day */}
            {wordOfDay && (
                <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Languages className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600">Word of the day</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg sm:text-2xl font-bold">{wordOfDay.primary}</p>
                            {wordOfDay.secondary && (
                                <p className="text-sm text-muted-foreground">{wordOfDay.secondary}</p>
                            )}
                            <p className="text-xs sm:text-sm text-muted-foreground">{wordOfDay.meaning}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                    { to: '/console', icon: Search, label: 'Console', color: 'text-blue-500 bg-blue-500/10' },
                    { to: '/courses', icon: BookOpen, label: 'Courses', color: 'text-purple-500 bg-purple-500/10' },
                    { to: '/stats', icon: TrendingUp, label: 'Stats', color: 'text-emerald-500 bg-emerald-500/10' },
                    { to: '/settings', icon: Settings, label: 'Settings', color: 'text-slate-500 bg-slate-500/10' },
                ].map((action) => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent transition-all group"
                    >
                        <div className={`h-9 w-9 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center ${action.color}`}>
                            <action.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                        </div>
                        <span className="text-[11px] sm:text-sm font-medium group-hover:text-primary transition-colors">{action.label}</span>
                    </Link>
                ))}
            </div>

            {/* Courses Section */}
            <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm sm:text-lg">Your Courses</h3>
                    <Button asChild variant="ghost" size="sm" className="text-xs h-7 sm:h-8 px-2 sm:px-3">
                        <Link to="/courses" className="gap-1">
                            View all
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>

                <div className="space-y-2">
                    {courses.length === 0 ? (
                        <Card>
                            <CardContent className="py-6 sm:py-8 text-center">
                                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {loading ? 'Loading courses…' : 'No courses available yet'}
                                </p>
                                <Button asChild variant="outline" size="sm" className="mt-3 sm:mt-4 h-8 text-xs">
                                    <Link to="/courses">Browse courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        courses.slice(0, 3).map((course, i) => (
                            <Link
                                key={course.id}
                                to={`/courses/${course.id}`}
                                className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl border border-border hover:bg-accent hover:border-primary/50 transition-all group"
                            >
                                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-base flex-shrink-0">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="font-semibold text-xs sm:text-base group-hover:text-primary transition-colors break-anywhere line-clamp-1">
                                        {course.title}
                                    </p>
                                    <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-1">
                                        {course.description || 'No description'}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Learning Tip */}
            <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs sm:text-sm">Daily tip</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                Review cards at the same time each day to build a strong study habit and improve long-term retention.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
}



