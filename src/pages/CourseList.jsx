import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { fetchJsonWithCache } from '@/lib/cache';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const loadCoursesWithTopics = async () => {
            try {
                const coursesRes = await api.get('/courses');
                const baseCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];

                // Fetch topic counts for each course
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
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to fetch courses', err);
                    setError('Failed to load courses.');
                    setLoading(false);
                }
            }
        };

        loadCoursesWithTopics();

        return () => {
            cancelled = true;
        };
    }, []);

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
                    <Link key={course.id} to={`/courses/${course.id}`}>
                        <Card className="hover:shadow-md hover:border-primary/50 transition-all group cursor-pointer h-full">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant="secondary">Level {i === 0 ? 'N5' : 'N4'}</Badge>
                                            <Badge variant="outline" className="text-xs">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                {course.topics?.length || 0} topics
                                            </Badge>
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors mb-2 break-all">{course.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}


