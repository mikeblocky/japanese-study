import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Lock, Globe2 } from 'lucide-react';
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map((course) => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="group block">
                        <Card className="h-full transition-all duration-200 hover:shadow-md border-border/60">
                            <CardHeader className="space-y-3 pb-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="border-border/80 bg-muted/40">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {course.topics?.length || 0} topics
                                    </Badge>
                                    {course.category && (
                                        <Badge variant="secondary" className="bg-secondary/40 text-foreground/80">{course.category}</Badge>
                                    )}
                                    {(course.minLevel || course.maxLevel || course.level) && (
                                        <Badge variant="outline" className="border-border/70 text-foreground/80">
                                            {course.minLevel && course.maxLevel
                                                ? `${course.minLevel}–${course.maxLevel}`
                                                : course.minLevel || course.maxLevel || course.level}
                                        </Badge>
                                    )}
                                    {course.visibility === 'PUBLIC' && (
                                        <Badge variant="outline" className="border-blue-300/50 text-blue-600 bg-blue-50/50"><Globe2 className="h-3 w-3 mr-1" />Public</Badge>
                                    )}
                                    {course.visibility === 'PRIVATE' && (
                                        <Badge variant="outline" className="border-orange-300/50 text-orange-600 bg-orange-50/50"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">{course.title}</h3>
                                    <CardDescription className="text-sm leading-relaxed line-clamp-2">
                                        {course.description || "Japanese vocab, grammar, and kanji practice."}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    {course.ownerUsername && course.visibility === 'PUBLIC' && (
                                        <span className="text-xs text-muted-foreground">by {course.ownerUsername}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-primary font-medium opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                    Start <ArrowRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}


