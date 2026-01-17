import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CourseList() {
    // Use custom hook - eliminates 30+ lines of code!
    const { courses: baseCourses, loading, error } = useCourses();
    const [courses, setCourses] = useState([]);

    // Fetch topic counts for each course
    useEffect(() => {
        if (baseCourses.length === 0) {
            setCourses([]);
            return;
        }

        let cancelled = false;

        const loadTopicsForCourses = async () => {
            const coursesWithTopics = await Promise.all(baseCourses.map(async (course) => {
                try {
                    const topicsRes = await api.get(`/courses/${course.id}/topics`);
                    return { ...course, topics: topicsRes.data || [] };
                } catch (err) {
                    console.error('Failed to load topics for course', course.id, err);
                    return { ...course, topics: [] };
                }
            }));

            if (!cancelled) {
                setCourses(coursesWithTopics);
            }
        };

        loadTopicsForCourses();

        return () => { cancelled = true; };
    }, [baseCourses]);

    // Dynamic border color for personality
    const getGradient = (index) => {
        // Now just border colors for distinct, flat look
        const colors = [
            'border-orange-400',
            'border-emerald-500',
            'border-rose-400',
            'border-amber-400',
        ];
        return colors[index % colors.length];
    };

    return (
        <PageShell className="space-y-8 pb-20">
            <div className="relative">
                <div className="absolute -left-10 top-0 h-32 w-32 bg-primary/10 rounded-full blur-3xl" />
                <PageHeader
                    title={<span className="font-serif italic text-4xl">The Collection</span>}
                    description="Structured paths for your journey."
                />
            </div>

            {loading && courses.length === 0 && (
                <div className="py-20 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Curating your courses...</p>
                </div>
            )}

            {error && courses.length === 0 && (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="pt-6">
                        <p className="text-base font-medium text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course, i) => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="block w-full group">
                        <Card className={`h-full transition-all duration-300 hover:scale-[1.01] hover:shadow-md border-l-4 ${getGradient(i)} bg-card`}>
                            <CardHeader className="relative overflow-hidden">
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    {/* Level Badge */}
                                    {(course.minLevel || course.maxLevel || course.level) && (
                                        <Badge variant="secondary" className="bg-secondary/50 border-none">
                                            {course.minLevel && course.maxLevel
                                                ? `${course.minLevel} - ${course.maxLevel}`
                                                : course.minLevel || course.maxLevel || course.level}
                                        </Badge>
                                    )}
                                    {/* Category Badge */}
                                    {course.category && (
                                        <Badge variant="outline" className="bg-transparent border-primary/20 text-muted-foreground">
                                            {course.category}
                                        </Badge>
                                    )}
                                    {/* Topics Count */}
                                    <Badge variant="outline" className="bg-transparent border-primary/10 text-muted-foreground">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {course.topics?.length || 0} Topics
                                    </Badge>
                                    {course.visibility === 'PUBLIC' && course.ownerUsername && (
                                        <Badge variant="outline" className="bg-transparent border-blue-400/30 text-blue-600 text-xs">
                                            🌍 by {course.ownerUsername}
                                        </Badge>
                                    )}
                                    {course.visibility === 'PRIVATE' && (
                                        <Badge variant="outline" className="bg-transparent border-orange-400/30 text-orange-600 text-xs">
                                            🔒 Private
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                                    {course.title}
                                </h3>

                                <CardDescription className="text-muted-foreground leading-relaxed font-medium">
                                    {course.description || "Comprehensive Japanese course covering vocabulary, grammar, and kanji reading practice."}
                                </CardDescription>

                                <div className="mt-6 flex items-center text-sm font-semibold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}


