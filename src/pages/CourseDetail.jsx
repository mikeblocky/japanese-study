import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CourseDetail() {
    const { courseId } = useParams();
    const [topics, setTopics] = useState([]);
    const [topicProgress, setTopicProgress] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch topics
        api.get(`/courses/${courseId}/topics`)
            .then(res => {
                const sorted = res.data.sort((a, b) => a.orderIndex - b.orderIndex);
                setTopics(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch topics", err);
                setLoading(false);
            });

        // Fetch progress for all topics
        api.get('/progress/summary?userId=1')
            .then(res => {
                // Convert array to map for easy lookup
                const progressMap = {};
                res.data.forEach(p => {
                    progressMap[p.topicId] = p.percentage;
                });
                setTopicProgress(progressMap);
            })
            .catch(err => console.error("Failed to fetch progress", err));
    }, [courseId]);

    if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground font-light text-xl animate-pulse">Loading curriculum...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="space-y-6">
                <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Courses
                </Link>

                <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-background/50 to-background/10 border border-white/10 shadow-2xl overflow-hidden glass-panel">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-muted-foreground/60 mb-2">
                                <BookOpen className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Course Curriculum</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">Japanese Basics</h1>
                            <p className="text-lg text-muted-foreground font-light max-w-lg">Master the fundamentals. Select a lesson below to begin your focused study session.</p>
                        </div>

                        <Link
                            to="/study/test"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-foreground/20"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            <span>Take a Test</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Curriculum List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-light px-4">Lessons</h2>
                <div className="grid gap-4">
                    {topics.map((topic, i) => (
                        <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                to={`/study/${topic.id}`}
                                className={cn(
                                    "group flex items-center justify-between p-6 rounded-[2rem] glass-panel border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                                    topicProgress[topic.id] >= 100
                                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                                        : "border-white/5 hover:border-white/20 hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-8">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center font-mono text-xl font-bold transition-all duration-300 border shadow-inner",
                                        topicProgress[topic.id] >= 100
                                            ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 group-hover:bg-emerald-500/30"
                                            : "bg-secondary/50 text-muted-foreground/50 group-hover:text-foreground group-hover:bg-background border-transparent group-hover:border-border/50"
                                    )}>
                                        {String(topic.orderIndex || i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-medium group-hover:text-primary transition-colors duration-300">{topic.title}</h3>
                                            {topicProgress[topic.id] >= 100 && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                                                    ✓ Complete
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-light">{topic.description || "No description available"}</p>
                                    </div>
                                </div>

                                <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                                    <Play className="w-5 h-5 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}



