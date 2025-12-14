import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Lightbulb, Languages, Play } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page';

export default function Dashboard() {
    const { courses, loading } = useCourses();

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

            {/* Stats */}
            <Card className="mb-6 bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{loading ? '...' : courses.length}</p>
                            <p className="text-xs text-muted-foreground">Courses available</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Courses Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Your Courses</h3>
                    <Button asChild variant="ghost" size="sm" className="text-xs h-8 px-3">
                        <Link to="/courses" className="gap-1">
                            View all
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>

                <div className="space-y-2">
                    {courses.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    {loading ? 'Loading courses…' : 'No courses available yet'}
                                </p>
                                <Button asChild variant="outline" size="sm" className="mt-4 h-8 text-xs">
                                    <Link to="/courses">Browse courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        courses.slice(0, 4).map((course, i) => (
                            <Link
                                key={course.id}
                                to={`/courses/${course.id}`}
                                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent hover:border-primary/50 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                        {course.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {course.description || 'No description'}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Learning Tip */}
            <Card className="mt-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Lightbulb className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Daily tip</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Study consistently each day to build strong memory retention.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
}
