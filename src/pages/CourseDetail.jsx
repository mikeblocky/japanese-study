import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, BookOpen, CheckCircle, Clock, Circle, Target } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { PageShell } from '@/components/ui/page';
import { Button } from '@/components/ui/button';

export default function CourseDetail() {
    const { courseId } = useParams();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ lessons: 0, items: 0 });

    // Use custom hook to get course data
    const { courses } = useCourses();
    const course = courses.find(c => c.id.toString() === courseId);

    useEffect(() => {
        let isCancelled = false;

        const loadTopicsWithProgress = async () => {
            try {
                // Fetch topics
                const res = await api.get(`/courses/${courseId}/topics`);

                // Sort by title (handles "Lesson 01", "Lesson 02" etc.) then by orderIndex
                const sorted = (res.data || []).sort((a, b) => {
                    const numA = parseInt(a.title?.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.title?.match(/\d+/)?.[0] || '0');
                    if (numA !== numB) return numA - numB;
                    return (a.orderIndex || 0) - (b.orderIndex || 0);
                });

                // For each topic, pull items and user progress to compute completion
                const enriched = await Promise.all(sorted.map(async (topic) => {
                    try {
                        const [itemsRes, progressRes] = await Promise.all([
                            api.get(`/topics/${topic.id}/items`),
                            api.get(`/progress/topic/${topic.id}`).catch(() => ({ data: [] }))
                        ]);

                        const items = itemsRes.data || [];
                        const progress = progressRes.data || [];
                        const itemsCount = items.length;
                        const completedItems = progress.filter(p => p.studied).length;
                        const completionRate = itemsCount > 0 ? completedItems / itemsCount : 0;

                        return {
                            ...topic,
                            itemsCount,
                            itemCount: itemsCount, // keep legacy name fallback
                            completedItems,
                            itemsCompleted: completedItems,
                            completionRate,
                            completion: completionRate,
                            completed: itemsCount > 0 && completedItems >= itemsCount,
                            inProgress: completedItems > 0 && completedItems < itemsCount,
                        };
                    } catch (err) {
                        console.warn(`Failed to hydrate topic ${topic.id}`, err);
                        return topic;
                    }
                }));

                if (isCancelled) return;
                const itemsTotal = enriched.reduce((sum, t) => sum + (t.itemsCount || t.itemCount || 0), 0);
                setTopics(enriched);
                setTotals({ lessons: enriched.length, items: itemsTotal });
            } catch (err) {
                if (!isCancelled) {
                    console.error("Failed to fetch topics", err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        loadTopicsWithProgress();

        return () => {
            isCancelled = true;
        };
    }, [courseId]);

    if (loading) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground font-medium">Loading curriculum...</span>
        </div>
    );

    const getStatus = (topic, index) => {
        const progress = topic.completionRate ?? topic.completion ?? topic.progress;
        const itemsDone = topic.itemsCompleted ?? topic.completedItems ?? 0;
        const itemsTotal = topic.itemsCount ?? topic.itemCount ?? 0;
        const hasFinishedItems = itemsTotal > 0 && itemsDone >= itemsTotal;
        const isComplete = Boolean(
            topic.completed ||
            topic.status === 'completed' ||
            (typeof progress === 'number' && progress >= 0.99) ||
            progress === 100 ||
            topic.reviewed === true ||
            topic.mastered === true ||
            topic.state === 'completed' ||
            hasFinishedItems
        );

        if (isComplete) return 'completed';
        if (topic.inProgress || topic.active || topic.status === 'in-progress') return 'current';
        if (course?.currentTopicId && course.currentTopicId === topic.id) return 'current';
        if (typeof progress === 'number' && progress > 0) return 'current';
        if (index === 0) return 'current';
        return 'not-started';
    };

    const statusStyles = {
        completed: {
            badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            dot: 'bg-emerald-500'
        },
        current: {
            badge: 'bg-amber-50 text-amber-700 border border-amber-200',
            dot: 'bg-amber-500'
        },
        'not-started': {
            badge: 'bg-muted text-muted-foreground border border-border',
            dot: 'bg-muted-foreground'
        }
    };

    const statusCounts = topics.reduce((acc, topic, i) => {
        const s = getStatus(topic, i);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    return (
        <PageShell className="pb-20">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
                <Link to="/courses" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to courses
                </Link>
            </Button>

            {/* Course Header */}
            <div className="relative mb-10 py-6">
                <div className="max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-4">
                        Study path
                    </div>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3 flex-1 min-w-0 max-w-4xl pr-2">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-primary leading-tight break-words line-clamp-2" title={course?.title}>
                                {course?.title || `Course ${courseId}`}
                            </h1>
                            <p className="text-xl text-muted-foreground font-serif leading-relaxed italic border-l-4 border-primary/20 pl-4 break-words">
                                {course?.description || 'A structured path to mastery.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                                <Target className="h-5 w-5" />
                                {course?.category || 'Mixed focus'} · {course?.minLevel || 'N/A'} to {course?.maxLevel || 'N/A'}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 min-w-[240px] sm:min-w-[300px] max-w-sm">
                            <StatTile icon={BookOpen} label="Lessons" value={totals.lessons} />
                            <StatTile icon={Circle} label="Items" value={totals.items} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="flex items-baseline gap-2 px-2 mb-4">
                    <h3 className="text-2xl font-serif text-foreground leading-tight">
                        Curriculum
                    </h3>
                    <span className="text-muted-foreground text-lg font-normal italic leading-tight">
                        ({topics.length} chapters)
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4 text-base">
                    <StatusLegend colorClass="bg-amber-500" label="In progress" count={statusCounts.current} />
                    <StatusLegend colorClass="bg-emerald-500" label="Completed" count={statusCounts.completed} />
                    <StatusLegend colorClass="bg-muted-foreground" label="Not started" count={statusCounts['not-started']} />
                </div>

                <div className="grid gap-3">
                    {topics.map((topic, i) => {
                        const status = getStatus(topic, i);
                        const styles = statusStyles[status];
                        return (
                            <Link
                                key={topic.id}
                                to={`/study/${topic.id}`}
                                className={`group relative flex items-center gap-6 p-5 rounded-2xl bg-card border ${status === 'current' ? 'border-amber-300' : 'border-border'} hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                            >
                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-mono font-bold text-xl ${styles.badge}`}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-xl group-hover:text-primary transition-colors truncate">
                                            {topic.title}
                                        </h4>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border ${styles.badge}`}>
                                            <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                                            {status === 'completed' ? 'Completed' : status === 'current' ? 'In progress' : 'Not started'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-base line-clamp-2">
                                        {topic.description || 'Vocabulary and grammar practice'}
                                    </p>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {(topic.itemsCount || topic.itemCount) ? `${topic.itemsCount || topic.itemCount} items` : 'Items pending import'}
                                    </div>
                                </div>

                                <div className="shrink-0 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    <Button size="icon" className="rounded-full h-10 w-10">
                                        <PlayCircle className="h-5 w-5 fill-current" />
                                    </Button>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </PageShell>
    );
}

function StatTile({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
                <div className="text-lg font-semibold">{value || 0}</div>
            </div>
        </div>
    );
}

function StatusLegend({ colorClass, label, count }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-muted-foreground">{typeof count === 'number' ? count : 0}</span>
        </div>
    );
}



