import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
        <PageShell className="space-y-8">
            <PageHeader title="Courses" description="Browse the library and jump into a course." />

            {loading && courses.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">Loading courses…</div>
            )}
            {error && courses.length === 0 && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course, i) => (
                    <Link key={course.id} to={`/courses/${course.id}`} className="block w-full">
                        <Card className="hover:shadow-md hover:border-primary/50 transition-all group cursor-pointer h-full overflow-hidden w-full">
                            <CardHeader className="w-full">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge variant="secondary">Level {i === 0 ? 'N5' : 'N4'}</Badge>
                                    <Badge variant="outline" className="text-xs">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {course.topics?.length || 0} topics
                                    </Badge>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto flex-shrink-0" />
                                </div>
                                <h3 className="group-hover:text-primary transition-colors mb-2 text-base font-semibold leading-snug w-full break-anywhere">
                                    {course.title}
                                </h3>
                                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}


