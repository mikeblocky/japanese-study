import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, PlayCircle } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CourseDetail() {
    const { courseId } = useParams();
    const [topics, setTopics] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch topics
        api.get(`/courses/${courseId}/topics`)
            .then(res => {
                // Sort by title (handles "Lesson 01", "Lesson 02" etc.) then by orderIndex
                const sorted = res.data.sort((a, b) => {
                    // Extract numbers from lesson titles for proper numeric sorting
                    const numA = parseInt(a.title?.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.title?.match(/\d+/)?.[0] || '0');
                    if (numA !== numB) return numA - numB;
                    return a.orderIndex - b.orderIndex;
                });
                setTopics(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch topics", err);
                setLoading(false);
            });

        api.get(`/courses/${courseId}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error("Failed to fetch course", err));
    }, [courseId]);

    if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground font-light text-xl">Loading curriculum...</div>;

    return (
        <PageShell className="space-y-8">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/courses">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to courses
                </Link>
            </Button>

            <PageHeader
                title={course?.title || `Course ${courseId}`}
                description={course?.description || 'Select a lesson to start studying.'}
            />

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Curriculum</h3>
                        <Badge variant="secondary">{topics.length} lessons</Badge>
                    </div>
                    <Separator className="mb-6" />
                    <div className="space-y-3">
                        {topics.map((topic, i) => (
                            <Link
                                key={topic.id}
                                to={`/study/${topic.id}`}
                                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all group"
                            >
                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary font-mono text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium group-hover:text-primary transition-colors">{topic.title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{topic.description || 'No description provided.'}</p>
                                </div>
                                <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
}



