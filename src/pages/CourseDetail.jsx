import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { PageShell } from '@/components/ui/page';
import { Button } from '@/components/ui/button';

export default function CourseDetail() {
    const { courseId } = useParams();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Use custom hook to get course data
    const { courses } = useCourses();
    const course = courses.find(c => c.id.toString() === courseId);

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
    }, [courseId]);

    if (loading) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground font-medium">Loading curriculum...</span>
        </div>
    );

    return (
        <PageShell className="pb-20">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
                <Link to="/courses" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to courses
                </Link>
            </Button>

            {/* Course Header */}
            <div className="relative mb-12 py-8">
                {/* Clean, no gradients */}
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6">
                        Study Path
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-serif text-primary mb-6 leading-tight">
                        {course?.title || `Course ${courseId}`}
                    </h1>
                    <p className="text-xl text-muted-foreground font-serif leading-relaxed italic border-l-4 border-primary/20 pl-6">
                        {course?.description || 'A structured path to mastery.'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <h3 className="text-2xl font-serif text-foreground">
                        Curriculum
                    </h3>
                    <span className="text-muted-foreground text-lg font-normal italic">
                        ({topics.length} chapters)
                    </span>
                </div>

                <div className="grid gap-3">
                    {topics.map((topic, i) => (
                        <Link
                            key={topic.id}
                            to={`/study/${topic.id}`}
                            className="group relative flex items-center gap-6 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-mono font-bold text-lg">
                                {String(i + 1).padStart(2, '0')}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                                    {topic.title}
                                </h4>
                                <p className="text-muted-foreground text-sm line-clamp-1">
                                    {topic.description || "Vocabulary and grammar practice"}
                                </p>
                            </div>

                            <div className="shrink-0 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <Button size="icon" className="rounded-full h-10 w-10">
                                    <PlayCircle className="h-5 w-5 fill-current" />
                                </Button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </PageShell>
    );
}



