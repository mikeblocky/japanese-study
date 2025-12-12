import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Play, Search, Settings, Zap, Target, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
    const [dueCount, setDueCount] = useState(0);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [dueRes, coursesRes] = await Promise.allSettled([
                    api.get('/study/items/due'),
                    api.get('/courses')
                ]);

                if (!cancelled && dueRes.status === 'fulfilled' && Array.isArray(dueRes.value.data)) {
                    setDueCount(dueRes.value.data.length);
                }
                if (!cancelled && coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value.data)) {
                    setCourses(coursesRes.value.data);
                }
            } catch (err) {
                console.error('Dashboard fetch failed', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <PageShell>
            <PageHeader 
                title="Dashboard" 
                description="Your study overview and quick actions"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Review Card - Featured */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="relative flex-shrink-0">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-primary/10 flex items-center justify-center">
                                        {dueCount > 0 ? (
                                            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                                        ) : (
                                            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                        <h2 className="text-xl sm:text-2xl font-bold">
                                            {loading ? 'Loading...' : dueCount > 0 ? `${dueCount} cards due` : 'All caught up!'}
                                        </h2>
                                        {dueCount > 0 && (
                                            <Badge variant="secondary" className="h-6">
                                                <Zap className="mr-1 h-3 w-3" />
                                                Ready to review
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground">
                                        {dueCount > 0 
                                            ? 'Start a quick review session to strengthen your memory' 
                                            : 'Great job! You\'ve completed all your reviews for today 🎉'}
                                    </p>
                                </div>
                                <Button
                                    asChild={dueCount > 0}
                                    disabled={dueCount === 0 || loading}
                                    size="lg"
                                    className="flex-shrink-0 w-full sm:w-auto"
                                >
                                    {dueCount > 0 ? (
                                        <Link to="/study/review" className="gap-2">
                                            <Play className="h-5 w-5" />
                                            Start review
                                        </Link>
                                    ) : (
                                        <span className="gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            All done
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Courses Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Your Courses</CardTitle>
                                    <CardDescription>Pick up where you left off</CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link to="/courses">View all</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {courses.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    {loading ? 'Loading courses…' : 'No courses available yet.'}
                                </p>
                            ) : (
                                courses.slice(0, 4).map((course, i) => (
                                    <Link
                                        key={course.id}
                                        to={`/courses/${course.id}`}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent hover:border-primary/50 transition-all group"
                                    >
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                                {course.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {course.description || 'No description'}
                                            </p>
                                        </div>
                                        <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>Shortcuts</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button asChild variant="outline" className="w-full justify-start h-12 hover:bg-accent hover:border-primary/50">
                                <Link to="/console">
                                    <Search className="mr-3 h-4 w-4" />
                                    Word Console
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start h-12 hover:bg-accent hover:border-primary/50">
                                <Link to="/courses">
                                    <BookOpen className="mr-3 h-4 w-4" />
                                    Browse Courses
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start h-12 hover:bg-accent hover:border-primary/50">
                                <Link to="/stats">
                                    <TrendingUp className="mr-3 h-4 w-4" />
                                    View Stats
                                </Link>
                            </Button>
                            <Separator className="my-3" />
                            <Button asChild variant="outline" className="w-full justify-start h-12 hover:bg-accent hover:border-primary/50">
                                <Link to="/settings">
                                    <Settings className="mr-3 h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Overview */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Due Today', value: loading ? '...' : dueCount, icon: Clock, color: 'bg-orange-500/10 text-orange-500' },
                            { label: 'Courses', value: loading ? '...' : courses.length, icon: BookOpen, color: 'bg-purple-500/10 text-purple-500' },
                            { label: 'Status', value: dueCount === 0 ? 'Complete' : 'In Progress', icon: Target, color: 'bg-green-500/10 text-green-500' }
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}



