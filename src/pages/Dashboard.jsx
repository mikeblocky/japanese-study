import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Play, Search, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/ui/page';
import { cn } from '@/lib/utils';

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
        <PageShell className="space-y-8">
            <PageHeader title="Dashboard" description="Quick view of what needs attention." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[{
                    label: 'Due today',
                    value: loading ? '…' : dueCount,
                    icon: Clock,
                    desc: 'Items ready for review',
                    color: 'from-blue-500 to-cyan-500'
                }, {
                    label: 'Courses',
                    value: loading ? '…' : courses.length,
                    icon: BookOpen,
                    desc: 'Available study tracks',
                    color: 'from-purple-500 to-pink-500'
                }, {
                    label: 'Vocabulary focus',
                    value: 'Console',
                    icon: Search,
                    desc: 'Manage and browse words',
                    color: 'from-orange-500 to-red-500'
                }].map(card => (
                    <Card key={card.label} className="hover:shadow-md transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <card.icon className="h-7 w-7" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="hover:shadow-md transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Play className="h-4 w-4 text-green-600" />
                                        </div>
                                        Review queue
                                    </CardTitle>
                                    <CardDescription className="mt-1.5">Start a short review session</CardDescription>
                                </div>
                                <Button
                                    asChild={dueCount > 0}
                                    disabled={dueCount === 0}
                                    size="sm"
                                    className="w-full sm:w-auto shadow-md"
                                >
                                    {dueCount > 0 ? (
                                        <Link to="/study/review" className="gap-2">
                                            <Play className="h-4 w-4" />
                                            Start review
                                        </Link>
                                    ) : (
                                        <span className="gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            All done
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Checking your due items…</p>
                            ) : dueCount > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{dueCount} cards</Badge>
                                    <span className="text-sm text-muted-foreground">waiting for review</span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">You're caught up for today! 🎉</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <BookOpen className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Courses
                                    </CardTitle>
                                    <CardDescription className="mt-1.5">Pick a course and jump into a lesson</CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
                                    <Link to="/courses">View all</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {courses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{loading ? 'Loading courses…' : 'No courses available yet.'}</p>
                            ) : (
                                <div className="space-y-2">
                                    {courses.slice(0, 4).map(course => (
                                        <Link
                                            key={course.id}
                                            to={`/courses/${course.id}`}
                                            className="block rounded-xl border border-border px-4 py-3.5 hover:bg-accent hover:border-primary/50 transition-all group"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate group-hover:text-primary transition-colors">{course.title}</p>
                                                    {course.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                                                    )}
                                                </div>
                                                <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Settings className="h-4 w-4 text-blue-600" />
                            </div>
                            Quick actions
                        </CardTitle>
                        <CardDescription className="mt-1.5">Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild variant="outline" className="w-full justify-start hover:bg-accent hover:border-primary/50 transition-all">
                            <Link to="/console">
                                <Search className="mr-2 h-4 w-4" />
                                Word console
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start hover:bg-accent hover:border-primary/50 transition-all">
                            <Link to="/courses">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Browse Courses
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start hover:bg-accent hover:border-primary/50 transition-all">
                            <Link to="/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
}



